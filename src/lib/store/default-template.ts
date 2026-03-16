export const DEFAULT_STORE_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ business_name }}</title>
  {% if theme.faviconUrl != "" %}
  <link rel="icon" href="{{ theme.faviconUrl }}">
  {% endif %}
  <style>
    :root {
      --store-primary: {{ theme.primaryColor }};
      --store-secondary: {{ theme.secondaryColor }};
      --store-accent: {{ theme.accentColor }};
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      background: #fafafa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .store-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .store-header .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }
    .store-header .logo img {
      height: 40px;
      width: auto;
    }
    .store-header .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--store-primary);
    }
    .store-header nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .store-header nav a {
      text-decoration: none;
      color: #4b5563;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.15s;
    }
    .store-header nav a:hover { color: var(--store-primary); }
    .store-main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .store-footer {
      background: white;
      border-top: 1px solid #e5e7eb;
      padding: 1.5rem 2rem;
      text-align: center;
      font-size: 0.8rem;
      color: #9ca3af;
    }
    .store-footer a {
      color: var(--store-primary);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <header class="store-header">
    <a href="/" class="logo">
      {% if theme.logoUrl != "" %}
      <img src="{{ theme.logoUrl }}" alt="{{ business_name }}">
      {% endif %}
      <span class="logo-text">{{ business_name }}</span>
    </a>
    <nav>
      <a href="/">Productos</a>
      <a href="/cart">Carrito</a>
    </nav>
  </header>

  <main class="store-main">
    {{ content }}
  </main>

  <footer class="store-footer">
    {% if branding %}
    <p>Powered by <a href="https://mercadi.cl" target="_blank">Mercadi.cl</a></p>
    {% else %}
    <p>&copy; {{ business_name }}</p>
    {% endif %}
  </footer>
</body>
</html>`;
