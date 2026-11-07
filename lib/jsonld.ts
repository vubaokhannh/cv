/** Serialises JSON-LD for an inline <script>; escapes `<` so content can never close the tag. */
export const jsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
