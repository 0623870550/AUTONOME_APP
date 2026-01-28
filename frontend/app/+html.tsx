export const prerender = false;

export default function RootLayout() {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AUTONOME</title>
      </head>
      <body>
        <div id="root" />
      </body>
    </html>
  );
}
