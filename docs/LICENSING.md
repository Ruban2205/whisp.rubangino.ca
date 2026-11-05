# Whisp licensing and attribution

Updated November 5, 2026. Licensor: **Ruban Gino Singh, operating as Ruban AI Labs**, a registered sole proprietorship. Publisher: **Ruban AI Labs**.

## License choice

Project-authored materials use the unmodified **Apache License 2.0**, to the extent of rights held by the licensor and respective contributors, with publisher/developer attribution in **NOTICE**. This permits free and commercial use, modification, and redistribution subject to its terms. The full [LICENSE](../LICENSE) controls; this guide is a practical summary, not a claim that every file or generated output is exclusively owned or copyright-protected.

The decision follows the [official license](https://www.apache.org/licenses/LICENSE-2.0.html), [application guidance](https://www.apache.org/legal/apply-license), and [licensing FAQ](https://www.apache.org/foundation/license-faq). Apache 2.0 was chosen instead of adding a custom mandatory-footer clause to a standard license. The NOTICE contains attribution, not additional restrictions.

## Patents, public GitHub hosting, and inspiration

**Owning a patent is not a prerequisite for Apache 2.0.** Section 3 grants only relevant patent rights a contributor can license. It does not assert that a patent exists, register one, grant someone else's patent rights, or guarantee freedom from infringement. The standard patent clause has not been removed or rewritten.

The owner reports no patents for Whisp. That statement is not a search for patents held by others.

Copyright and patents address different rights. Eligible original software can have copyright without being a patented invention; a general idea or independently implemented functionality is not made exclusive by this notice. Whisp does not claim to have invented journaling, breathing exercises, anxiety reflection, speech recognition, or their underlying third-party technologies. See [CIPO's software IP guidance](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/intellectual-property-rights-software-canada).

Apache 2.0 is a [GitHub-recognized license](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository). A public repository alone is not a substitute for permission to reuse code. The license makes permissions explicit for work the licensor is entitled to license; it does not validate code copied from another public repository or website.

Being inspired by other resources is different from reproducing their protected code, text, imagery, or music. Any reused material needs its own compatible permission/license and notices. AI assistance or automated generation is not evidence of exclusive rights or proof that an output is cleared for reuse. This release makes no blanket originality or infringement-clearance warranty.

## Sole-proprietorship identity

The owner confirmed that Ruban AI Labs is a registered sole proprietorship. The notices therefore name the individual operating under that business name, rather than asserting a separate corporation owns the work. This follows the distinction in [Alberta's business-name guidance](https://www.alberta.ca/business-names) and the [CRA's sole-proprietorship guidance](https://www.canada.ca/en/revenue-agency/services/tax/businesses/small-businesses-self-employed-income/setting-your-business/sole-proprietorship.html).

The notice covers only rights held by the licensor/contributors. Business-name registration does not establish ownership of third-party work, patent protection, or separate corporate liability protection. If the business later incorporates or accepts external contributions, document the applicable ownership, employment, assignment, or contributor permissions rather than assuming registration or a GitHub account transfers rights.

## Reusing or distributing Whisp

- Include the Apache 2.0 license and preserve applicable copyright, patent, trademark, and attribution notices.
- Include the applicable NOTICE attribution in a location permitted by Section 4(d): distributed notice/source/documentation or the relevant generated notices display. Do not remove Ruban AI Labs' applicable publisher notice when redistributing Whisp-derived material.
- Mark modified files as changed as required by Section 4(b). Additional notices may identify your contributions without misrepresenting the original creator or publisher.
- Preserve third-party licenses and notices. React, Transformers.js, ONNX Runtime, Whisper/model files, and fonts are not relicensed as Ruban AI Labs property. See [third-party notices](../THIRD_PARTY_NOTICES.md).
- The license does not grant general permission to use Whisp's or Ruban AI Labs' names/logos as a trademark or imply endorsement. It permits the origin/notice uses described in Section 6.

Preserving the applicable NOTICE is required on redistribution. A permanent public footer or marketing credit is **not** an extra requirement of this project. A clear optional acknowledgment is:

> Based on Whisp, originally created by Ruban Gino Singh and published by Ruban AI Labs. Licensed under Apache 2.0.

Link the publisher to **https://labs.rubangino.ca/** and the source to **https://github.com/Ruban2205/whisp.rubangino.ca** where links are supported. This example complements the complete required notices; it does not replace them.

## Scope

The project license applies to project-authored code, documentation, supportive notes, and visual/audio material only to the extent of the rights the licensor/contributors hold, except where an upstream or separate license is identified. It does not claim ownership of third-party libraries, fonts, models, or user writing. Visitors do not license their notebook entries to Ruban AI Labs by using Whisp.

The attribution conditions concern reuse of this licensed work. Independently using React, Whisper, speech recognition, breath detection, or a similar idea does not by itself require credit to Whisp. Canada's [software IP guidance](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/intellectual-property-rights-software-canada) distinguishes protected original code from independently implemented functionality.

## Distribution

The source distribution includes root `LICENSE`, `NOTICE`, and `THIRD_PARTY_NOTICES.md`, plus upstream texts in `docs/licenses/`. Package metadata uses the SPDX identifier `Apache-2.0`.

The static build includes `/LICENSE.txt`, `/NOTICE.txt`, and `/licenses/` with third-party notices/license texts. Vite generates `licenses/BUNDLED_DEPENDENCIES.md` for the main application bundle. Separately retained texts cover the speech worker's Transformers.js/ONNX Runtime dependencies and copied model/runtime/font assets, including ONNX Runtime's upstream third-party notices at the installed source revision. This inventory aids notice preservation and is not a legal clearance audit. Developer galleries, tests, and internal documentation remain excluded. The release gate checks notice identity and preservation of upstream texts.

## Practical maintenance

Keep a source/license record for any imported snippet, article extract, illustration, quote collection, audio, model, or contribution. Preserve the actual upstream notices rather than replacing their owner with Ruban AI Labs. A source that is merely free to view is not automatically licensed for copying. No specific borrowed webpage or codebase was identified by the owner for a separate rights audit.

No custom legal conditions, jurisdiction clause, damages provision, patent claim, or IP-registration claim has been added. The license's warranty/liability terms are subject to applicable law and do not guarantee immunity from claims. This review checks the selected license and known notices; it is not a patent search or legal opinion on every source. For business-level assurance about ownership, borrowed material, liability, or branding, have a Canadian IP lawyer review the actual materials and circumstances, as [CIPO recommends for specific legal advice](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/guide-copyright).
