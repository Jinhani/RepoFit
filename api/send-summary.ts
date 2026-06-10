import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendSummaryRequest = {
    to: string;
    subject: string;
    markdownSummary: string;
};

function escapeHtml(text: string) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
    try {
        if (!process.env.RESEND_API_KEY) {
            return Response.json({ message: "RESEND_API_KEY가 설정되어 있지 않습니다." }, { status: 500 });
        }

        const body: SendSummaryRequest = await request.json();

        const to = body.to.trim();
        const subject = body.subject.trim();
        const markdownSummary = body.markdownSummary.trim();

        if (to === "" || subject === "" || markdownSummary === "") {
            return Response.json({ message: "받을 이메일, 제목, 본문이 모두 필요합니다." }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: "RepoFit <onboarding@resend.dev>",
            to: [to],
            subject,
            text: markdownSummary,
            html: `<pre style="white-space: pre-wrap; font-family: system-ui, sans-serif;">${escapeHtml(
                markdownSummary,
            )}</pre>`,
        });

        if (error) {
            return Response.json({ message: "이메일 전송에 실패했습니다.", error }, { status: 500 });
        }

        return Response.json({
            message: "이메일 전송에 성공했습니다.",
            id: data?.id,
        });
    } catch {
        return Response.json({ message: "요청 처리 중 문제가 발생했습니다." }, { status: 500 });
    }
}
