interface StoreFooterProps {
  businessName: string;
  showBranding: boolean;
}

export function StoreFooter({ businessName, showBranding }: StoreFooterProps) {
  return (
    <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
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
