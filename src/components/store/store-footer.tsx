interface StoreFooterProps {
  businessName: string;
  showBranding: boolean;
}

export function StoreFooter({ businessName, showBranding }: StoreFooterProps) {
  return (
    <footer
      className="border-t py-6 text-center text-sm"
      style={{
        backgroundColor: "var(--store-surface, white)",
        color: "var(--store-muted, #9ca3af)",
        borderColor: "var(--store-muted, #e5e7eb)33",
      }}
    >
      <p>
        {showBranding && (
          <>
            Tienda creada con{" "}
            <a
              href="https://mercadi.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: "var(--store-primary)" }}
            >
              Mercadi.cl
            </a>
            {" · "}
          </>
        )}
        &copy; {new Date().getFullYear()} {businessName}
      </p>
    </footer>
  );
}
