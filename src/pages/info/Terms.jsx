import { Link } from 'react-router-dom';
import InfoLayout, { Section, SupportEmail } from './InfoLayout';

export default function Terms() {
  return (
    <InfoLayout
      title="Terms of use"
      intro="The rules for using PrimeTickets, whether you are buying tickets or selling them."
      updated="11 November 2026"
      current="/terms"
    >
      <Section title="1. Who we are">
        <p>
          PrimeTickets (primeticketsoko.com) is an online ticketing service operated in Kenya by
          PrimeTickets Ltd. By using the site you agree to these terms. If you do not agree,
          please do not use the site.
        </p>
      </Section>

      <Section title="2. Our role">
        <p>
          Events listed on PrimeTickets are run by independent organisers. We sell tickets on the
          organiser's behalf and deliver them to you. The organiser, not PrimeTickets, is
          responsible for the event itself: its content, safety, venue, timing and whether it
          takes place.
        </p>
      </Section>

      <Section title="3. Buying tickets">
        <ul>
          <li>Prices are shown in Kenya shillings. A 5% service fee is added at checkout and shown before you pay.</li>
          <li>Your order is complete only when payment is confirmed by our payment partner, Paystack.</li>
          <li>Tickets are sent by email to the address you give us. Make sure it is correct.</li>
          <li>We may limit how many tickets one person can buy, and cancel orders that appear fraudulent.</li>
        </ul>
      </Section>

      <Section title="4. Using your ticket">
        <ul>
          <li>Each ticket carries a QR code that is accepted once per person it admits. Keep it private.</li>
          <li>Entry is subject to the organiser's and venue's rules, including age limits and security checks.</li>
          <li>We are not responsible for tickets that are lost, shared or copied after delivery.</li>
        </ul>
      </Section>

      <Section title="5. Refunds, transfers and resale">
        <p>
          Refunds are covered by our{' '}
          <Link to="/refunds" className="text-primary-600 font-semibold hover:underline">refund policy</Link>,
          which forms part of these terms. You may transfer a ticket to another PrimeTickets
          account, or resell it on our Resale Market for no more than 150% of the price you paid.
          Reselling PrimeTickets tickets anywhere else is not permitted and such tickets may be
          cancelled.
        </p>
      </Section>

      <Section title="6. Your account">
        <p>
          You are responsible for keeping your password safe and for what happens in your
          account. Give us accurate information and tell us promptly if you think someone else
          has accessed your account.
        </p>
      </Section>

      <Section title="7. Event organisers">
        <ul>
          <li>You must have the right to hold the event and sell tickets for it, and your listing must be accurate.</li>
          <li>You must honour every valid ticket sold through PrimeTickets.</li>
          <li>If you cancel or postpone an event, you must tell us immediately and make the funds available for refunds to buyers.</li>
          <li>PrimeTickets deducts an agreed commission from ticket sales. Payout terms are agreed with each organiser.</li>
          <li>We may remove a listing or suspend an account that is misleading, unlawful or puts buyers at risk.</li>
        </ul>
      </Section>

      <Section title="8. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>use bots or other automated tools to buy tickets;</li>
          <li>attempt to interfere with the site, other users' accounts or the payment process;</li>
          <li>post false, offensive or unlawful content, including in chat and networking features.</li>
        </ul>
      </Section>

      <Section title="9. Liability">
        <p>
          We work to keep the site available and accurate, but we provide it as it is. To the
          extent the law allows, our liability to you for any order is limited to the amount you
          paid for that order. Nothing in these terms removes rights you have under Kenyan
          consumer protection law.
        </p>
      </Section>

      <Section title="10. Changes and governing law">
        <p>
          We may update these terms; the date at the top shows the latest version. These terms
          are governed by the laws of Kenya, and the Kenyan courts have jurisdiction over any
          dispute.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms: <SupportEmail />.</p>
      </Section>
    </InfoLayout>
  );
}
