import Script from "next/script";

export function GoogleDriveScript() {
    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
            <Script src="https://apis.google.com/js/api.js" strategy="beforeInteractive" />
        </>
    );
}
