import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "white", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "min(100%, 430px)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 32, background: "rgba(255,255,255,.03)" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", opacity: .6 }}>Vault Studio</p>
        <h1 style={{ margin: "0 0 10px", fontSize: 34, fontWeight: 600 }}>Choose a new password</h1>
        <p style={{ margin: "0 0 28px", lineHeight: 1.6, opacity: .68 }}>Use the secure link from your recovery email to set a new Vault Admin password.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
