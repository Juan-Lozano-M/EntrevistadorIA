package com.interviewai.email;

import com.interviewai.auth.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/** Builds the HTML for each notification type and hands it to the transport. */
@Service
public class EmailService {
    private final ResendClient resend;
    private final String appUrl;

    public EmailService(ResendClient resend, @Value("${app.frontend-url:http://localhost:5173}") String appUrl) {
        this.resend = resend;
        this.appUrl = appUrl;
    }

    public void dailyReminder(User u, int streak) {
        String body = streak > 0
            ? "Llevas una racha de <strong>" + streak + (streak == 1 ? " día" : " días")
                + "</strong>. No la pierdas: dedica unos minutos a practicar una entrevista hoy."
            : "Dedica unos minutos hoy a practicar una entrevista y empieza tu racha.";
        resend.send(u.getEmail(), "¿Practicamos hoy? · InterviewAI",
            template("¿Practicamos hoy?", body, "Empezar entrevista", "/new"));
    }

    public void weeklySummary(User u, int count, int avg, int streak) {
        String body = count == 0
            ? "Esta semana no registraste entrevistas. ¡Una sesión corta basta para retomar el ritmo!"
            : "Esta semana completaste <strong>" + count + "</strong> "
                + (count == 1 ? "entrevista" : "entrevistas")
                + " con un puntaje medio de <strong>" + avg + "/100</strong>. "
                + "Racha actual: <strong>" + streak + (streak == 1 ? " día" : " días") + "</strong>.";
        resend.send(u.getEmail(), "Tu resumen semanal · InterviewAI",
            template("Tu semana en InterviewAI", body, "Ver mi progreso", "/app/progreso"));
    }

    public void achievementsUnlocked(User u, List<String> titles) {
        String list = titles.stream()
            .map(t -> "<li style=\"margin:4px 0;\">🏆 <strong>" + escape(t) + "</strong></li>")
            .reduce("", String::concat);
        String body = "¡Felicidades! Has desbloqueado "
            + (titles.size() == 1 ? "un nuevo logro" : titles.size() + " nuevos logros") + ":"
            + "<ul style=\"padding-left:18px;margin:12px 0;\">" + list + "</ul>";
        resend.send(u.getEmail(), "¡Nuevo logro desbloqueado! · InterviewAI",
            template("Logro desbloqueado", body, "Ver mis logros", "/app/logros"));
    }

    /** Sends a one-off test email; returns true if it was actually dispatched. */
    public boolean testEmail(User u) {
        return resend.send(u.getEmail(), "Correo de prueba · InterviewAI",
            template("¡Funciona! 🎉",
                "Si estás leyendo esto, las notificaciones por correo de InterviewAI están configuradas correctamente.",
                "Ir a InterviewAI", "/app"));
    }

    public void passwordReset(User u, String token) {
        String body = "Recibimos una solicitud para restablecer la contraseña de tu cuenta. "
            + "El enlace caduca en 1 hora. Si no fuiste tú, ignora este correo y tu contraseña seguirá igual.";
        resend.send(u.getEmail(), "Restablece tu contraseña · InterviewAI",
            template("Restablece tu contraseña", body, "Crear nueva contraseña", "/reset-password?token=" + token));
    }

    public void productNews(User u, String subject, String htmlBody) {
        resend.send(u.getEmail(), subject + " · InterviewAI",
            template("Novedades de InterviewAI", htmlBody, "Descubrir", "/app"));
    }

    private String template(String heading, String bodyHtml, String ctaLabel, String ctaPath) {
        String cta = appUrl + ctaPath;
        return """
            <div style="margin:0;padding:24px;background:#0b0f1a;font-family:'Segoe UI',Arial,sans-serif;">
              <div style="max-width:520px;margin:0 auto;background:#12172250;border:1px solid #2a3147;border-radius:16px;overflow:hidden;">
                <div style="padding:20px 24px;border-bottom:1px solid #2a3147;color:#fff;font-size:18px;font-weight:700;">
                  InterviewAI
                </div>
                <div style="padding:24px;color:#c7cede;font-size:15px;line-height:1.6;">
                  <h1 style="margin:0 0 12px;color:#fff;font-size:20px;">%s</h1>
                  <p style="margin:0 0 20px;">%s</p>
                  <a href="%s" style="display:inline-block;background:#6c5ce7;color:#fff;text-decoration:none;
                     padding:11px 20px;border-radius:10px;font-weight:600;">%s</a>
                </div>
                <div style="padding:16px 24px;border-top:1px solid #2a3147;color:#7b8294;font-size:12px;">
                  Puedes ajustar tus notificaciones en Configuración → Notificaciones.
                </div>
              </div>
            </div>
            """.formatted(escape(heading), bodyHtml, cta, escape(ctaLabel));
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
