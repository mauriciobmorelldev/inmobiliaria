type StitchHtmlProps = {
  html: string;
  className?: string;
};

export default function StitchHtml({ html, className }: StitchHtmlProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
