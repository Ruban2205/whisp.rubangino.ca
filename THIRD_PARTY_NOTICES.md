# Third-party notices

Whisp's font assets are bundled locally through Fontsource. Each is licensed under the SIL Open Font License 1.1:

- Caveat: [OFL notice](docs/licenses/caveat-OFL.txt)
- Cormorant Garamond: [OFL notice](docs/licenses/cormorant-garamond-OFL.txt)
- DM Sans: [OFL notice](docs/licenses/dm-sans-OFL.txt)

React and React DOM are distributed under the MIT License; their complete license is included in [the React/React DOM MIT notice](docs/licenses/react-MIT.txt). The build also generates `licenses/BUNDLED_DEPENDENCIES.md` for the main application bundle. The separately bundled speech worker uses Transformers.js and ONNX Runtime Common/Web, covered by the retained notices below. Development tools and their transitive dependencies retain their respective package licenses. `package-lock.json` records the complete dependency graph.

The starfield, orbital artwork, favicon, sharing composition, paper texture configuration, particle animation, and synthesized entry chime and notebook musical score are created in code for this project. No stock imagery or music is used.

Project-authored materials are offered under Apache 2.0 by Ruban Gino Singh, operating as Ruban AI Labs, to the extent of rights held by the licensor and contributors; see [LICENSE](LICENSE) and [publisher attribution](NOTICE). That license does not replace or override the third-party licenses listed here or claim ownership of their technology. Trademark rights are addressed separately by Section 6 of the project license.

Private voice typing uses Transformers.js 3.8.1 ([Apache 2.0 notice](docs/licenses/transformers-APACHE.txt)) and ONNX Runtime ([MIT notice](docs/licenses/onnxruntime-MIT.txt)). Its speech model is Whisper Tiny English by OpenAI ([upstream MIT notice](docs/licenses/whisper-MIT.txt)), converted to quantized ONNX by Xenova. The conversion repository declares Apache 2.0. The model revision is pinned to `79fb389fc764e7c395bd330e9531d9d32ada7049`; `scripts/prepare-voice.mjs` downloads the model assets and copies the installed runtime for self-hosting. No remote inference service is used. Model assets remain under their upstream licenses.

The installed ONNX Runtime Web/Common build identifies source revision `89f8206ba4`. Its complete [upstream third-party notices](docs/licenses/onnxruntime-THIRD-PARTY-NOTICES.txt) are preserved from [Microsoft's source at that revision](https://github.com/microsoft/onnxruntime/blob/89f8206ba4/ThirdPartyNotices.txt). This upstream inventory may include components beyond the browser subset; retaining it does not imply Ruban AI Labs authored or owns those components.

The 100 completion quotes are original writing for Whisp, with no attributed quotations copied from a third-party collection. The public historical audio test fixture is documented in `tests/fixtures/README.md`.
