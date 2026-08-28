/**
 * media-projection-engine — N-025
 * Constroi as media-specs (hero, OG, social, thumbnails) com versoes e seeds
 * deterministicos. Nao desenha: entrega a spec + o hash de entrada, para que a
 * renderizacao seja reperformavel byte a byte.
 */
import { mediaSpec, FORMATS } from '../renderers/social-renderer.mjs';
export const VERSION = '1.0.0';
export const MODEL = 'cko-coren-flat-card@1.0.0'; // composicao vetorial deterministica, sem modelo generativo

export function buildMediaSpecs(dtos, hashFn) {
  return dtos
    .filter(d => d.surface === 'social' && d.eligibility.eligible)
    .map(d => {
      const spec = mediaSpec(d);
      return {
        ...spec,
        engine: `media-projection-engine@${VERSION}`,
        media_model: MODEL,
        template_version: '2.0.0',
        input_hash: hashFn(JSON.stringify(spec.fields)),
        deterministic: true,
        generative_model_used: false,
      };
    });
}

export { FORMATS };
