# Teddy bears — source and attribution

- **Title:** Teddy bears
- **Creator:** [hectopod](https://sketchfab.com/hectopod)
- **Original work:** https://sketchfab.com/3d-models/teddy-bears-e84b12b4ac20402aaf4d40f2219cd0e2
- **License:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Commercial use and redistribution are permitted under the attribution terms. The downloaded attribution statement is retained unchanged in [LICENSE.txt](LICENSE.txt).

## Download provenance

The original download package was obtained from this public redistribution at a fixed commit:

https://github.com/Sherlockk-23/SpongeBob/tree/2479d76fac715e5199abbcec1637e4f81e86874e/assets_/models/%40to_be_processed/bears

Raw-download base URL:

`https://raw.githubusercontent.com/Sherlockk-23/SpongeBob/2479d76fac715e5199abbcec1637e4f81e86874e/assets_/models/%40to_be_processed/bears/`

Append the relative file path from the table below. Hashes identify the unmodified downloaded source package, before conversion or pose adaptation:

| Original file | Bytes | SHA-256 |
| --- | ---: | --- |
| `scene.gltf` | 36480 | `23c23102bd85fed12391d79b7a7ff82d527d3eb284bc8ce6710afde46f3fbebe` |
| `scene.bin` | 1604640 | `3de454aea2644b29a5475a95b3c253e9254ea4c91d5a0a48111a3d60fcd2a95b` |
| `textures/fabric_brown_normal.png` | 1636438 | `eeae7fa2a87e55b51e3f456a0322b62aa7e9c59a02e892eedab3b3c19f4cc0a1` |
| `license.txt` | 664 | `dbfb5fba66b3961675d80a372052bb40861dbcceede097285b29654dd2f091ee` |

The source `scene.gltf` embeds the original creator, source URL and `CC-BY-4.0` in `asset.extras`. The adjacent downloaded `license.txt` gives the same attribution and explicitly permits commercial use. A separate 2023 project also attributes the same model and license: [NeuStyle README](https://github.com/wernerpe/NeuStyle/blob/0f284ef0d6fbbea9eb1d287c1274c03a4bae3f08/README.md).

## Page adaptation

The page uses the **brown bear** from the original two-bear scene. Adaptation selects that character, normalizes its size and adjusts its pose and rendering for holding the page's map. Original mesh geometry, vertex normals, UVs, material definitions and arm skin weights are the basis of the adapted model. The fabric normal texture is the downloaded `textures/fabric_brown_normal.png`; its original `KHR_texture_transform` uses a UV scale of 7. The source contains rigged characters but no prebuilt animation clips.

The sideways head tilt is removed by rotating the model's original `head_01` joint approximately 29.78° until its head-to-end axis aligns with the body's up direction. No face, ear, mesh, UV, material or skin-weight data is remodeled. The original normalization is retained, so this head adjustment does not move the seated feet, change the body pose, or alter the original arm lengths and shoulder/palm landmarks. `convert.py` reproduces the adjustment in both the runtime data and the rigged GLB; the GLB also records this pose modification in its attribution extras.

The toon webpage deliberately omits the knitted-fabric normal texture from `teddy-model.js`, using the renderer's simpler shading instead. This removes the embedded texture payload without changing the model's 12,752 triangles, vertex positions, geometric normals, UVs or skin weights. The archived `teddy-bear.glb` retains the original material definitions and embedded fabric texture. The converter defaults to this lighter web export; `--web-normal-map` restores the embedded normal texture for a textured web renderer.

The page's `plush.js` also applies a lighter brown body colour (`Object_7`, linear RGBA `[0.36, 0.205, 0.12, 1]`), a warm oatmeal colour on the original fabric muzzle and a simple eye highlight (`Object_10`) for the toon presentation. The converter locates the muzzle by following the connected fabric surface closest to the nose and assigns its 960 triangles a separate web draw group. The dark mouth and nose retain their source colours. These display overrides do not modify the original colour factors stored in `teddy-model.js` or the archived GLB.

The family portrait retains its separate procedural characters. The map image is an existing placeholder and is not part of hectopod's model.

## Credit to retain when sharing

> This work is based on “Teddy bears” by hectopod, licensed under CC BY 4.0. Model selection, scale, pose and rendering were adapted for this webpage.

- Work: https://sketchfab.com/3d-models/teddy-bears-e84b12b4ac20402aaf4d40f2219cd0e2
- Creator: https://sketchfab.com/hectopod
- License: https://creativecommons.org/licenses/by/4.0/

The page's “模型署名” disclosure provides these links and identifies the modifications. Preserve both that attribution and these source records in redistributed copies.
