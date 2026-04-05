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
      {showBranding ? (
        <p>
          Powered by{" "}
          <a
            href="https://mercadi.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
            style={{ color: "var(--store-primary)" }}
          >
            Mercadi.cl
          </a>
        </p>
      ) : (
        <p>&copy; {businessName}</p>
      )}
    </footer>
  );
}
