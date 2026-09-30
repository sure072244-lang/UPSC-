import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Backdrop3D from "@/components/Backdrop3D";
import { ChakraMark } from "@/components/kit";
import { ApiError, apiGet, apiPost } from "@/lib/api";

type PasskeyStatus = { registered: boolean };
type DataDiagnostics = {
  pyq_rows: number;
  source_rows: number;
  question_text_rows: number;
  title_only_question_rows: number;
  unmatched_question_text_rows: number;
  official_paper_rows: number;
  pyq_available: boolean;
  mongo_configured: boolean;
  notion_configured: boolean;
};
type PasskeyOptions = { challenge: string; options: Record<string, unknown> };
type CredentialDescriptorJSON = { id: string; [key: string]: unknown };

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

function encodeBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeOptions(options: Record<string, unknown>) {
  const decoded: Record<string, unknown> = {
    ...options,
    challenge: decodeBase64Url(String(options.challenge)),
  };
  const user = options.user as Record<string, unknown> | undefined;
  if (user && typeof user.id === "string") {
    decoded.user = { ...user, id: decodeBase64Url(user.id) };
  }
  for (const field of ["allowCredentials", "excludeCredentials"] as const) {
    const descriptors = options[field] as CredentialDescriptorJSON[] | undefined;
    if (descriptors) {
      decoded[field] = descriptors.map((descriptor) => ({
        ...descriptor,
        id: decodeBase64Url(descriptor.id),
      }));
    }
  }
  return decoded;
}

function serializeCredential(credential: PublicKeyCredential) {
  const common = {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
  };
  if ("attestationObject" in credential.response) {
    const response = credential.response as AuthenticatorAttestationResponse;
    return {
      ...common,
      response: {
        attestationObject: encodeBase64Url(response.attestationObject),
        clientDataJSON: encodeBase64Url(response.clientDataJSON),
        transports: response.getTransports(),
      },
    };
  }
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    ...common,
    response: {
      authenticatorData: encodeBase64Url(response.authenticatorData),
      clientDataJSON: encodeBase64Url(response.clientDataJSON),
      signature: encodeBase64Url(response.signature),
      userHandle: response.userHandle ? encodeBase64Url(response.userHandle) : null,
    },
  };
}

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["auth", "passkey-status"],
    queryFn: () => apiGet<PasskeyStatus>("/auth/passkey/status"),
    retry: false,
  });
  const dataStatus = useQuery({
    queryKey: ["data", "diagnostics"],
    queryFn: () => apiGet<DataDiagnostics>("/diagnostics/data"),
    retry: false,
  });

  const authenticate = useMutation({
    mutationFn: async () => {
      if (!window.isSecureContext || !("PublicKeyCredential" in window)) {
        throw new Error("Use Chrome on Android over HTTPS to create a device passkey.");
      }
      const registering = !status.data?.registered;
      const flow = registering ? "register" : "login";
      const challenge = await apiPost<PasskeyOptions>(`/auth/passkey/${flow}/options`);
      const publicKey = decodeOptions(challenge.options);
      const credential = registering
        ? await navigator.credentials.create({
            publicKey: publicKey as unknown as PublicKeyCredentialCreationOptions,
          })
        : await navigator.credentials.get({
            publicKey: publicKey as unknown as PublicKeyCredentialRequestOptions,
          });
      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error("Passkey operation was cancelled or unavailable.");
      }
      await apiPost(`/auth/passkey/${flow}/verify`, {
        challenge: challenge.challenge,
        credential: serializeCredential(credential),
      });
      return registering;
    },
    onSuccess: async (registered) => {
      toast.success(registered ? "Passkey created on this device" : "Signed in with passkey");
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/", { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const detail =
          typeof error.body === "object" && error.body !== null && "detail" in error.body
            ? error.body.detail
            : undefined;
        toast.error(typeof detail === "string" ? detail : "Passkey could not be verified.");
      } else {
        toast.error(error instanceof Error ? error.message : "Passkey sign-in failed.");
      }
    },
  });

  const passkeysSupported =
    typeof window !== "undefined" && window.isSecureContext && "PublicKeyCredential" in window;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#FBF9F4] px-4">
      <Backdrop3D />
      <main className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-[#E8E3D7] bg-white/95 p-8 shadow-[0_24px_64px_rgba(28,29,24,0.12)] backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <ChakraMark className="size-14" />
            <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#1C1D18]">
              Professor 🥼
            </h1>
            <p className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#8C6212]">
              Passkey sign-in · UPSC CSE 2027
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#5E6258]">
              {status.data?.registered
                ? "Continue with the passkey saved on this device."
                : "Create a passkey using this device's fingerprint, face, or screen lock."}
            </p>
          </div>

          {status.isError ? (
            <div className="mt-7 grid gap-3 text-center">
              <p className="text-sm text-[#9B2C2C]">
                Server unavailable. Check MongoDB configuration and try again.
              </p>
              <Button variant="outline" onClick={() => void status.refetch()}>
                Retry connection
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              data-testid="passkey-submit-button"
              disabled={status.isPending || authenticate.isPending || !passkeysSupported}
              onClick={() => authenticate.mutate()}
              className="mt-7 h-12 w-full bg-[#1D3A2C] text-white transition-colors hover:bg-[#2F5E48]"
            >
              <Fingerprint className="size-5" />
              {status.isPending || authenticate.isPending
                ? "Waiting for device…"
                : status.data?.registered
                  ? "Continue with passkey"
                  : "Create passkey on this device"}
            </Button>
          )}

          {!passkeysSupported && !status.isError ? (
            <p className="mt-3 text-center text-xs text-[#9B2C2C]">
              Open this HTTPS site in Chrome on Android to use a device passkey.
            </p>
          ) : null}

          <p className="mt-4 text-center text-xs text-[#8B8F83]">
            {status.data?.registered
              ? "Confirm with your device screen lock."
              : "The first passkey registered becomes the tracker owner."}
          </p>
          <div className="mt-5 border-t border-[#E8E3D7] pt-4 text-left text-xs text-[#5E6258]" aria-live="polite">
            {dataStatus.data ? (
              <>
                <p>
                  PYQ data: {dataStatus.data.pyq_rows.toLocaleString()} questions
                  {dataStatus.data.pyq_available ? " ready" : " missing from deployment"}
                </p>
                <p className="mt-1">
                  Text: {dataStatus.data.question_text_rows.toLocaleString()} full · {dataStatus.data.title_only_question_rows.toLocaleString()} title-only · {dataStatus.data.unmatched_question_text_rows.toLocaleString()} unmatched
                </p>
                <p className="mt-1">
                  Official paper links: {dataStatus.data.official_paper_rows.toLocaleString()}
                </p>
                <p className="mt-1">
                  Notion sync: {dataStatus.data.notion_configured ? "token configured" : "NOTION_TOKEN required"}
                </p>
                {!dataStatus.data.mongo_configured ? (
                  <p className="mt-1 text-[#9B2C2C]">MONGO_URL is not configured on the server.</p>
                ) : null}
              </>
            ) : dataStatus.isError ? (
              <p className="text-[#9B2C2C]">Data status unavailable. Check Vercel function logs and deployment variables.</p>
            ) : (
              <p>Checking question bank and integration setup…</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
