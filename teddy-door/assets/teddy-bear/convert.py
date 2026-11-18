"""Rebuild the downloaded hectopod teddy asset offline with Blender 4.3+.

Source: "Teddy bears" by hectopod, licensed CC BY 4.0.
https://sketchfab.com/3d-models/teddy-bears-e84b12b4ac20402aaf4d40f2219cd0e2

Obtain the original, legally downloaded glTF package separately. This script
never downloads assets. --source must contain scene.gltf, its scene.bin, and
its textures directory. It selects the original fabric_brown bear and keeps
its geometry, materials, authored weights, and seated/waving pose. Only the
original head_01 bone is rotated to remove the head's sideways tilt.

Reproduce from the repository root (Blender runs without a display):
    blender --background --factory-startup \
      --python teddy-door/assets/teddy-bear/convert.py -- \
      --source /path/to/original-download \
      --output /path/to/converted-assets

--output defaults to this script's directory. Outputs are teddy-bear.glb
(the interoperable model with the original 12-joint rig and embedded texture)
and teddy-model.js (window.teddyAsset, with the adjusted pose baked and the
original two arm weights retained). The toon web export omits the fabric normal
texture by default; --web-normal-map opts back into embedding it in the JS.
The GLB always retains the original materials and embedded normal texture.
No previews are rendered. A structural validation report is printed after
export; invalid data raises an error.
"""

import argparse
import array
import base64
from collections import defaultdict
import json
import math
import mimetypes
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Matrix, Vector


def arguments():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source', type=Path, required=True,
                        help='Directory containing the original downloaded scene.gltf package')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parent,
                        help='Output directory; defaults to this script directory')
    parser.add_argument('--web-normal-map', action='store_true',
                        help='Embed the original fabric normal map in JS; off for the toon web export. '
                             'The GLB always retains this texture.')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    return parser.parse_args(argv)


def read_source(directory):
    path = directory / 'scene.gltf'
    data = json.loads(path.read_text())
    for resource in data.get('buffers', []) + data.get('images', []):
        uri = resource.get('uri', '')
        if uri.startswith('data:') or not uri:
            continue
        if '://' in uri:
            raise ValueError('Conversion is offline; replace remote glTF resources with local files.')
        if not (directory / uri).is_file():
            raise FileNotFoundError(directory / uri)
    extras = data.get('asset', {}).get('extras', {})
    if not all(key in extras for key in ('author', 'license', 'source', 'title')):
        raise ValueError('The original asset attribution is missing from scene.gltf.')
    return path, data


def evaluated_parts(parts):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    return [(obj, obj.evaluated_get(depsgraph),
             obj.evaluated_get(depsgraph).to_mesh(preserve_all_data_layers=True,
                                                depsgraph=depsgraph)) for obj in parts]


def muzzle_component(mesh, local_nose_center):
    """Find the original disconnected fabric surface directly underneath the nose."""
    # UV seams can give a point more than one vertex index in an imported glTF.
    points = [tuple(round(c, 6) for c in vertex.co) for vertex in mesh.vertices]
    neighbours = defaultdict(set)
    for edge in mesh.edges:
        a, b = (points[i] for i in edge.vertices)
        neighbours[a].add(b)
        neighbours[b].add(a)
    closest = min(mesh.vertices, key=lambda vertex: (vertex.co - local_nose_center).length_squared)
    connected = {points[closest.index]}
    pending = list(connected)
    while pending:
        for point in neighbours[pending.pop()] - connected:
            connected.add(point)
            pending.append(point)
    return {index for index, point in enumerate(points) if point in connected}


def validate_runtime(asset):
    count = 0
    max_normal_error = 0
    for part in asset['parts']:
        values = array.array('f')
        values.frombytes(base64.b64decode(part['vertices'], validate=True))
        if sys.byteorder != 'little':
            values.byteswap()
        if len(values) % 30:
            raise ValueError('A primitive does not contain complete stride-10 triangles.')
        for i in range(0, len(values), 10):
            vertex = values[i:i + 10]
            if not all(math.isfinite(value) for value in vertex):
                raise ValueError('Non-finite vertex data.')
            error = abs(math.sqrt(sum(value * value for value in vertex[3:6])) - 1)
            max_normal_error = max(max_normal_error, error)
            if error > 1e-4:
                raise ValueError('An exported normal is not normalized.')
            if min(vertex[8:10]) < 0 or sum(vertex[8:10]) > 1.00001:
                raise ValueError('Invalid authored arm weights.')
        count += len(values) // 10
    if count // 3 != asset['stats']['triangles']:
        raise ValueError('Exported triangle count does not match the vertex arrays.')
    return {'vertices': count, 'triangles': count // 3, 'maxNormalError': max_normal_error}


def validate_glb(path):
    binary = path.read_bytes()
    magic, version, length = struct.unpack_from('<III', binary)
    if magic != 0x46546C67 or version != 2 or length != len(binary):
        raise ValueError('Invalid GLB header.')
    chunk_length, chunk_type = struct.unpack_from('<II', binary, 12)
    if chunk_type != 0x4E4F534A:
        raise ValueError('GLB JSON chunk is missing.')
    document = json.loads(binary[20:20 + chunk_length])
    if len(document.get('meshes', [])) != 4 or len(document.get('skins', [])) != 1:
        raise ValueError('The GLB must contain only the selected four-part brown bear.')
    if len(document['skins'][0]['joints']) != 12:
        raise ValueError('The original 12-joint skeleton was not preserved.')
    if len(document.get('images', [])) != 1:
        raise ValueError('The original normal texture was not preserved.')
    if not any(node.get('extras', {}).get('asset_source') for node in document['nodes']):
        raise ValueError('GLB attribution extras are missing.')
    return {'meshes': 4, 'joints': 12, 'images': 1, 'bytes': len(binary)}


def convert(source_directory, output_directory, web_normal_map=False):
    source_path, source = read_source(source_directory)
    output_directory.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source_path))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    brown = next(obj for obj in meshes
                 if any(material and material.name == 'fabric_brown' for material in obj.data.materials))
    rig = next(modifier.object for modifier in brown.modifiers if modifier.type == 'ARMATURE')
    parts = [obj for obj in meshes if any(modifier.type == 'ARMATURE' and modifier.object == rig
                                        for modifier in obj.modifiers)]
    bpy.context.view_layer.update()
    evaluated = evaluated_parts(parts)
    by_object = {obj: (evaluated_obj, mesh) for obj, evaluated_obj, mesh in evaluated}

    body = rig.matrix_world @ rig.pose.bones['body_00'].matrix
    head = rig.matrix_world @ rig.pose.bones['head_01'].matrix
    origin = body.translation.copy()
    up = (body.to_3x3() @ Vector((0, 1, 0))).normalized()
    nose = next(obj for obj in parts if any(material and material.name == 'Nose.002'
                                          for material in obj.data.materials))
    nose_object, nose_mesh = by_object[nose]
    nose_center = sum((nose_object.matrix_world @ vertex.co for vertex in nose_mesh.vertices),
                      Vector()) / len(nose_mesh.vertices)
    forward = nose_center - head.translation
    forward -= up * forward.dot(up)
    forward.normalize()
    right = up.cross(forward).normalized()
    forward = right.cross(up).normalized()
    basis = Matrix((right, up, forward))
    local_points = [basis @ (evaluated_obj.matrix_world @ vertex.co - origin)
                    for _, evaluated_obj, mesh in evaluated for vertex in mesh.vertices]
    minimum = [min(point[axis] for point in local_points) for axis in range(3)]
    maximum = [max(point[axis] for point in local_points) for axis in range(3)]
    scale = 2.05 / (maximum[1] - minimum[1])

    # Keep this original normalization fixed: straightening the head must not
    # rescale the body, move the seated feet, or change the authored arm reach.
    head_bone = rig.pose.bones['head_01']
    head_end = rig.pose.bones['head_end_012']
    head_world = rig.matrix_world @ head_bone.matrix
    head_axis = (rig.matrix_world @ head_end.head - head_world.translation).normalized()
    correction = head_axis.rotation_difference(up)
    pivot = head_world.translation.copy()
    correction_world = (Matrix.Translation(pivot) @ correction.to_matrix().to_4x4()
                        @ Matrix.Translation(-pivot))
    for _, evaluated_obj, _ in evaluated:
        evaluated_obj.to_mesh_clear()
    head_bone.matrix = rig.matrix_world.inverted() @ correction_world @ head_world
    bpy.context.view_layer.update()
    evaluated = evaluated_parts(parts)
    posed_points = [basis @ (evaluated_obj.matrix_world @ vertex.co - origin)
                     for _, evaluated_obj, mesh in evaluated for vertex in mesh.vertices]
    posed_minimum = [min(point[axis] for point in posed_points) for axis in range(3)]
    posed_maximum = [max(point[axis] for point in posed_points) for axis in range(3)]
    pose_adjustment = {'bone': 'head_01', 'rotationDegrees': math.degrees(correction.angle),
                       'method': 'Rotate the original head joint to align head-to-end with body up; '
                                 'retain original mesh, materials, skin weights, body pose and normalization.'}

    def normalized(point):
        q = basis @ (Vector(point) - origin)
        return [q.x * scale, (q.y - minimum[1]) * scale + .80, q.z * scale]

    def arm_landmarks(name):
        bone = rig.pose.bones[name]
        shoulder = rig.matrix_world @ bone.head
        # The authored end joint is reliable; Blender's display-bone tail is not.
        end = rig.matrix_world @ (bone.children[0].head if bone.children else bone.tail)
        axis = (end - shoulder).normalized()
        weighted = []
        for obj, evaluated_obj, mesh in evaluated:
            group = obj.vertex_groups.get(name)
            if group is None:
                continue
            for vertex in obj.data.vertices:
                weight = next((g.weight for g in vertex.groups if g.group == group.index), 0)
                if weight > .8:
                    point = evaluated_obj.matrix_world @ mesh.vertices[vertex.index].co
                    weighted.append((point.dot(axis), point))
        weighted.sort(key=lambda pair: pair[0])
        if not weighted:
            raise ValueError('No authored arm weights found for ' + name)
        tip = weighted[int(len(weighted) * .86):]
        palm = sum((point for _, point in tip), Vector()) / len(tip)
        return {'bone': name, 'shoulder': normalized(shoulder), 'boneEnd': normalized(end),
                'palm': normalized(palm), 'armLength': (end - shoulder).length * scale}

    arms = sorted([arm_landmarks('armR_02'), arm_landmarks('armL_04')],
                  key=lambda arm: arm['shoulder'][0])
    posed_nose, posed_nose_mesh = next((evaluated_obj, mesh) for obj, evaluated_obj, mesh
                                      in evaluated if obj == nose)
    posed_nose_center = posed_nose.matrix_world @ (sum((v.co for v in posed_nose_mesh.vertices),
                                                       Vector()) / len(posed_nose_mesh.vertices))
    material_by_name = {material['name']: material for material in source['materials']}
    primitives = []
    normal_images = set()
    for obj, evaluated_obj, mesh in evaluated:
        mesh.calc_loop_triangles()
        normal_matrix = basis @ evaluated_obj.matrix_world.to_3x3().inverted().transposed()
        uv = mesh.uv_layers.active.data if mesh.uv_layers.active else None
        groups = [obj.vertex_groups.get(arm['bone']) for arm in arms]
        muzzle = (muzzle_component(mesh, evaluated_obj.matrix_world.inverted() @ posed_nose_center)
                  if obj == brown else set())
        by_material = {}
        for triangle in mesh.loop_triangles:
            key = (triangle.material_index, triangle.vertices[0] in muzzle)
            values = by_material.setdefault(key, array.array('f'))
            for loop_index in triangle.loops:
                vertex_index = mesh.loops[loop_index].vertex_index
                position = normalized(evaluated_obj.matrix_world @ mesh.vertices[vertex_index].co)
                normal = (normal_matrix @ mesh.corner_normals[loop_index].vector).normalized()
                texcoord = uv[loop_index].uv if uv else Vector((0, 0))
                weights = [next((g.weight for g in obj.data.vertices[vertex_index].groups
                                 if group and g.group == group.index), 0) for group in groups]
                # Restore glTF UV convention; the runtime uploads normalMap with flipY=false.
                values.extend([*position, *normal, texcoord.x, 1 - texcoord.y, *weights])
        for (material_index, is_muzzle), values in by_material.items():
            material = material_by_name[mesh.materials[material_index].name]
            pbr = material.get('pbrMetallicRoughness', {})
            normal = material.get('normalTexture')
            normal_uv = [1, 1]
            if normal:
                transform = normal.get('extensions', {}).get('KHR_texture_transform', {})
                if transform.get('offset', [0, 0]) != [0, 0] or transform.get('rotation', 0) != 0:
                    raise ValueError('This runtime contract does not support UV offset or rotation.')
                normal_uv = transform.get('scale', [1, 1])
                normal_images.add(source['textures'][normal['index']]['source'])
            if sys.byteorder != 'little':
                values.byteswap()
            primitives.append({'name': obj.name + ('_muzzle' if is_muzzle else ''),
                               'vertices': base64.b64encode(values.tobytes()).decode('ascii'),
                               'material': {'baseColorFactor': pbr.get('baseColorFactor', [1, 1, 1, 1]),
                                            'roughnessFactor': pbr.get('roughnessFactor', 1),
                                            'metallicFactor': pbr.get('metallicFactor', 1),
                                            'normalTexture': 'fabric_brown_normal' if normal and web_normal_map else None,
                                            'normalUVScale': normal_uv,
                                            'normalScale': normal.get('scale', 1) if normal else 1,
                                            'hasNormalMap': normal is not None and web_normal_map}})
    if len(normal_images) != 1:
        raise ValueError('Expected the original shared normal texture.')
    image = source['images'][normal_images.pop()]
    image_path = source_directory / image['uri']
    mime = image.get('mimeType') or mimetypes.guess_type(image_path.name)[0] or 'image/png'
    triangle_count = sum(len(base64.b64decode(part['vertices'])) // 120 for part in primitives)
    asset = {'source': source['asset']['extras'], 'shoulders': [arm['shoulder'] for arm in arms],
             'wrists': [arm['palm'] for arm in arms],
             'bounds': {'min': [posed_minimum[0] * scale, (posed_minimum[1] - minimum[1]) * scale + .80,
                                posed_minimum[2] * scale],
                        'max': [posed_maximum[0] * scale, (posed_maximum[1] - minimum[1]) * scale + .80,
                                posed_maximum[2] * scale]},
             'poseAdjustment': pose_adjustment,
             'arms': arms,
             'stats': {'stride': 10, 'triangles': triangle_count}, 'parts': primitives}
    if web_normal_map:
        asset['normalMap'] = ('data:' + mime + ';base64,'
                              + base64.b64encode(image_path.read_bytes()).decode('ascii'))
    runtime_report = validate_runtime(asset)

    # Export only the selected downloaded bear and its ancestor transforms.
    # Preserve the original rig, node hierarchy, materials, and packed texture.
    bpy.ops.object.select_all(action='DESELECT')
    selection = set(parts + [rig])
    for obj in list(selection):
        parent = obj.parent
        while parent:
            selection.add(parent)
            parent = parent.parent
    for obj in selection:
        obj.select_set(True)
    rig['asset_source'] = source['asset']['extras']['source']
    rig['asset_author'] = source['asset']['extras']['author']
    rig['asset_license'] = source['asset']['extras']['license']
    rig['asset_pose_adjustment'] = pose_adjustment['method']
    bpy.context.view_layer.objects.active = rig
    glb_path = output_directory / 'teddy-bear.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format='GLB', use_selection=True,
                              export_extras=True, export_animations=False,
                              export_rest_position_armature=False, export_current_frame=True)
    glb_report = validate_glb(glb_path)
    runtime_path = output_directory / 'teddy-model.js'
    runtime_path.write_text('"use strict";\nwindow.teddyAsset = '
                            + json.dumps(asset, separators=(',', ':')) + ';\n')
    print('EXPORT_VALIDATED ' + json.dumps({'runtime': runtime_report, 'glb': glb_report,
                                          'output': str(output_directory)}), flush=True)


if __name__ == '__main__':
    options = arguments()
    convert(options.source.resolve(), options.output.resolve(), options.web_normal_map)
