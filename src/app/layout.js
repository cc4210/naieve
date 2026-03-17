export const metadata = {
  title: "NAI:Eve",
  description: "Naïve AI · Eve — a first-year engineering student chatbot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
