import { Link } from 'react-router-dom';
import InfoLayout, { Section, SupportEmail } from './InfoLayout';

export default function Refunds() {
  return (
    <InfoLayout
      title="Refund policy"
      intro="When you can get your money back, and what to do when you cannot."
      updated="11 November 2026"
      current="/refunds"
    >
      <Section title="The short version">
        <ul>
          <li><strong>Event cancelled:</strong> you get the ticket price back.</li>
          <li><strong>Event postponed or moved:</strong> your ticket stays valid, or you can ask for a refund.</li>
          <li><strong>Changed your mind or cannot attend:</strong> tickets are not refundable, but you can transfer or resell them.</li>
        </ul>
      </Section>

      <Section title="Cancelled events">
        <p>
          If an organiser cancels an event and does not reschedule it, we refund the ticket price
          to the payment method you used (M-Pesa or card). You do not need to apply. Refunds are
          normally sent within 14 days of the cancellation being confirmed; your bank or mobile
          provider may take a few more days to show it.
        </p>
      </Section>

      <Section title="Postponed or relocated events">
        <p>
          If an event moves to a new date or venue, your ticket remains valid for the new
          arrangements. If you cannot make it, email us within 7 days of the change being
          announced and we will refund the ticket price.
        </p>
      </Section>

      <Section title="When tickets are not refundable">
        <p>All other sales are final. This includes when:</p>
        <ul>
          <li>you can no longer attend or have changed your mind;</li>
          <li>you arrive late, are refused entry for breaking the venue's rules, or leave early;</li>
          <li>the line-up, programme or timings change without the event being cancelled;</li>
          <li>your ticket was used by someone else because the QR code was shared.</li>
        </ul>
        <p>
          You can still <strong>transfer</strong> your ticket to a friend or list it on the{' '}
          <Link to="/market" className="text-primary-600 font-semibold hover:underline">Resale Market</Link>{' '}
          from My Tickets.
        </p>
      </Section>

      <Section title="The service fee">
        <p>
          The 5% service fee covers payment processing and ticket delivery. It is refunded when an
          event is cancelled, and is not refunded in other cases.
        </p>
      </Section>

      <Section title="Paid twice or charged the wrong amount?">
        <p>
          If you were charged more than once for the same order, or money left your account and no
          ticket arrived, email us with your order reference or M-Pesa code. Duplicate and failed
          payments are always refunded in full.
        </p>
      </Section>

      <Section title="Tickets bought on the Resale Market">
        <p>
          Resale tickets are covered in the same way if the event is cancelled: the buyer is
          refunded the amount they paid.
        </p>
      </Section>

      <Section title="How to ask for a refund">
        <p>
          Email <SupportEmail /> from the address you used to buy, and include your order
          reference. We reply within 2 working days.
        </p>
      </Section>
    </InfoLayout>
  );
}
