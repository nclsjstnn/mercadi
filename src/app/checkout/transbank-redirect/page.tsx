import { notFound } from "next/navigation";

interface Props {
  searchParams: Promise<{ token?: string; url?: string }>;
}

/**
 * Intermediate page that auto-submits a POST form to WebPay Plus.
 *
 * Transbank requires the browser to POST `token_ws` to the WebPay URL —
 * a plain GET redirect doesn't work. This page renders a hidden form and
 * immediately submits it via JavaScript, with a manual submit button as fallback.
 */
export default async function TransbankRedirectPage({ searchParams }: Props) {
  const { token, url } = await searchParams;

  if (!token || !url) return notFound();

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Redirigiendo a WebPay...</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f9fafb;
            color: #374151;
          }
          .card {
            background: white;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            max-width: 360px;
            width: 100%;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #f97316;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          button {
            margin-top: 16px;
            padding: 10px 24px;
            background: #f97316;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="spinner" />
          <p>Redirigiendo a WebPay...</p>
          <form id="tbk-form" method="POST" action={url}>
            <input type="hidden" name="token_ws" value={token} />
            <noscript>
              <button type="submit">Ir a WebPay</button>
            </noscript>
          </form>
        </div>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById('tbk-form').submit();`,
          }}
        />
      </body>
    </html>
  );
}
