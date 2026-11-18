# Toon room assets: sources, licenses and adaptations

The final room uses nine **Kenney Furniture Kit** models under **CC0 1.0 Universal**. Their native low-poly geometry and solid-color materials support the page's toon style. Room surfaces use no downloaded image textures. The dusk valley and the four seasonal tree scenes in the window are original canvas illustrations.

The living-room bear is separately licensed: **Teddy bears by hectopod, CC BY 4.0**. Both licenses permit commercial use; the bear requires attribution, a source link, the license link and an indication of modifications. The page's “素材署名” disclosure retains that credit.

## Models used

Counts describe each unique GLB once, before scene duplication. The nine GLBs contain zero texture images and total **854 triangles and 81,644 bytes**. The room places ten instances, totaling **978 triangles**. The square side table appears twice. These figures count the imported furniture meshes. The bear, room shell, original props and family characters have separate geometry.

| Page file | Kenney source model | Triangles | Bytes | Preparation |
| --- | --- | ---: | ---: | --- |
| `models/sofa.glb` | `loungeSofa` | 128 | 9,916 | Node translation centers the existing model; mesh unchanged. |
| `models/table.glb` | `tableCoffeeSquare` | 124 | 8,564 | Node translation centers the existing model; mesh unchanged. |
| `models/coffee-table.glb` | `tableRound` | 80 | 6,444 | Original GLB. Scaled at runtime to an oval foreground table, approximately 1.65 wide, 0.90 deep and 0.48 high in scene units. |
| `models/lamp.glb` | `lampRoundTable` | 76 | 6,604 | Original GLB unchanged. |
| `models/plant.glb` | `pottedPlant` | 60 | 7,576 | Original GLB unchanged. |
| `models/rug.glb` | `rugRounded` | 204 | 10,876 | Original GLB unchanged. |
| `models/frame.glb` | `wallWindow` | 40 | 10,532 | Centers the wood frame and moves its outer corners inward to produce 0.012-wide rails around the original opening. |
| `models/window.glb` | `wallWindowSlide` | 80 | 14,268 | Keeps the two wood sashes. Moves their inner edges outward to produce 0.012-wide rails. |
| `models/books.glb` | `books` | 62 | 6,864 | Original GLB unchanged. |

Runtime placement, scaling and palette changes adapt the downloaded assets to the room. The selected meshes are the original low-poly designs. Both frame assets omit the original glass and surrounding wall primitives. Their rail vertex positions were adjusted in X and Y. They retain their original topology, normals, and depth.

## Exact provenance and license

Official creator and collection: [Kenney — Furniture Kit](https://kenney.nl/assets/furniture-kit).  
License: [Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

Files come from this immutable public mirror:
[RetroDECK/RetroQUEST at dfa19a5602a31f64bd890d15279a61f43b127328](https://github.com/RetroDECK/RetroQUEST/tree/dfa19a5602a31f64bd890d15279a61f43b127328/assets/kenney_furniture-kit/Models/GLTF%20format).

The same package's original [Kenney Furniture Kit license notice](LICENSES/Kenney-Furniture-Kit-License.txt) identifies Kenney as creator/distributor, names CC0, and explicitly permits commercial use. The mirror supplies the download and is not the creator.

[source-records.json](source-records.json) records each original URL, fixed commit, original/prepared SHA-256, byte count, triangle count, world bounds and modifications. Hashes refer to the final web GLBs and the original downloads. The full [CC0 legal text](LICENSES/CC0-1.0.txt) is included.

## Frame openings

The picture frame comes from the source window's wood frame and has no backing panel. Its node is centered at the origin; the open rectangle is X **−0.1380731 to +0.1380731**, Y **−0.282839 to +0.282839**, Z **0**. Its inner dimensions are **0.2761463 × 0.565678**. X/Y scaling fits the family photograph.

The window retains its original outer dimensions of **0.3745832 × 0.664115**. Its two open rectangles each measure **0.3505832 × 0.3080575**. Exact coordinates are recorded in the JSON. Each selected opening was checked with a 21 × 31 grid of Z-axis rays inset from its boundaries; all 651 rays per opening passed without hitting the retained wood geometry.

## Bear and original scene content

**[Teddy bears](https://sketchfab.com/3d-models/teddy-bears-e84b12b4ac20402aaf4d40f2219cd0e2) by [hectopod](https://sketchfab.com/hectopod)** is licensed under **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. The page selects the brown character, adjusts its scale and map-holding pose, and straightens its existing head joint by approximately 29.78°. The web export omits the knitted-fabric normal texture; runtime rendering uses a lighter brown palette, two-tone cel shading, a contour that follows the moving arms and a small eye highlight. Source mesh geometry and skin weights remain the basis of the adaptation. Detailed provenance and the original notice are retained in [../teddy-bear/SOURCE.md](../teddy-bear/SOURCE.md) and [../teddy-bear/LICENSE.txt](../teddy-bear/LICENSE.txt).

The room shell, illustrated floor boards, armrest throw and linen cushion were made for this page. The foreground table holds an original ceramic mug and an open field notebook with a drawn botanical specimen. A gathered curtain and its rod frame the window. The window shows an original painting of a valley at dusk. As the camera approaches, its four panes show the same tree across the seasons, with blossoms, summer foliage, maple leaves and snow. The winter pane includes a bear-shaped snow figure. The family-portrait characters remain the page's separate procedural models. The existing placeholder map is outside these model licenses.

When a visitor selects a pane, a separate foreground mark moves from the window into the chart. The summer parasol tree leaf is original. The cherry petal, maple leaf and snowflake adapt Twemoji graphics under CC BY 4.0. [Transition mark credits](../seasons/CREDITS.md)

## Rendering and distribution

Three.js loads the furniture GLBs and applies the room's shared palette and four-band lighting. Flat shading preserves the furniture facets. Subtle lines emphasize the sofa, side tables and lamp. The bear has its own two-tone lighting and warm contour. Scene lights and shadow maps create the floor/object shadows. Downloaded bear geometry uses its adapted pose system; the family characters retain their procedural geometry.

Retain the visible bear and Twemoji credits when sharing the prototype. [Attribution notices](COPYRIGHT-NOTICES.md) Kenney does not require attribution under CC0; source records and the original notice remain included for provenance. Three.js uses its separate [MIT notice](../vendor/THREE-LICENSE.txt). These model licenses do not relicense the complete webpage, code, map or other dependencies.
