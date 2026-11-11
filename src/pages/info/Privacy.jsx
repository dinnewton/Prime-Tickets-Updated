import InfoLayout, { Section, SupportEmail } from './InfoLayout';

export default function Privacy() {
  return (
    <InfoLayout
      title="Privacy policy"
      intro="What personal information PrimeTickets collects, why, and the choices you have."
      updated="11 November 2026"
      current="/privacy"
    >
      <Section title="Who is responsible for your data">
        <p>
          PrimeTickets Ltd operates primeticketsoko.com and decides how your personal data is
          used. We handle it in line with Kenya's Data Protection Act, 2019.
        </p>
      </Section>

      <Section title="What we collect">
        <ul>
          <li><strong>When you buy a ticket:</strong> your name, email address, phone number, what you bought and the payment reference.</li>
          <li><strong>When you create an account:</strong> your name, email and password. Passwords are stored in scrambled form and cannot be read by us. If you sign in with Google, we receive your name and email from Google.</li>
          <li><strong>If you use networking:</strong> the profile details you choose to add, such as your profession, interests and a short bio.</li>
          <li><strong>If you sell tickets:</strong> your business name, contact person, phone number and event details.</li>
          <li><strong>When you contact us:</strong> the messages you send through chat or email.</li>
          <li><strong>Automatically:</strong> your IP address and basic request logs, used for security and to limit abuse.</li>
        </ul>
        <p>
          We do not receive or store your card number or M-Pesa PIN. Those are entered on
          Paystack's secure pages.
        </p>
      </Section>

      <Section title="How we use it">
        <ul>
          <li>to process your order and send your tickets and receipts;</li>
          <li>to check tickets at the door and prevent fraud or duplicate entry;</li>
          <li>to run your account, transfers and resale listings;</li>
          <li>to answer your questions and deal with refunds;</li>
          <li>to meet our legal and accounting obligations.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use it for advertising by other companies.</p>
      </Section>

      <Section title="Who we share it with">
        <ul>
          <li><strong>The event organiser:</strong> your name and ticket details, so they can admit you and manage the event.</li>
          <li><strong>Paystack:</strong> to process your payment.</li>
          <li><strong>Our email and messaging providers</strong> (Brevo and Twilio): to deliver your tickets and notifications.</li>
          <li><strong>Google:</strong> only if you choose to sign in with Google.</li>
          <li><strong>Other attendees:</strong> only if you turn on networking, and only the profile details you added.</li>
          <li><strong>Authorities:</strong> where the law requires it.</li>
        </ul>
        <p>Some of these providers process data outside Kenya. We use established providers that apply appropriate safeguards.</p>
      </Section>

      <Section title="Cookies and browser storage">
        <p>
          We store a small amount of information in your browser to keep you signed in, remember
          your cart and keep your support chat connected. We do not use advertising or tracking
          cookies.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Order and payment records are kept for as long as tax and accounting rules require.
          Account details are kept until you ask us to delete your account. Chat messages are
          kept only for a short period.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Under the Data Protection Act you can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you and give you a copy;</li>
          <li>correct anything that is wrong;</li>
          <li>delete your data, where we no longer need it by law;</li>
          <li>stop using your data for a particular purpose.</li>
        </ul>
        <p>
          Email <SupportEmail /> and we will respond within 30 days. If you are unhappy with our
          answer, you can complain to the Office of the Data Protection Commissioner
          (odpc.go.ke).
        </p>
      </Section>

      <Section title="Security">
        <p>
          The site is served over an encrypted connection, passwords are stored in scrambled
          form, and access to customer data is limited to staff who need it. No system is
          perfectly secure; if a breach affects you, we will tell you and the regulator as the
          law requires.
        </p>
      </Section>

      <Section title="Changes">
        <p>We may update this policy. The date at the top shows when it last changed.</p>
      </Section>
    </InfoLayout>
  );
}
