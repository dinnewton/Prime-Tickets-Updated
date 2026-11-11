import { Link } from 'react-router-dom';
import InfoLayout, { Section, SupportEmail } from './InfoLayout';

const FAQ = [
  {
    group: 'Buying tickets',
    items: [
      ['How do I buy a ticket?', <>Open an event, choose Standard or VIP and how many tickets you need, then tap <strong>Buy Now</strong>. Enter your name, email and phone number and pay on the secure Paystack page. You can buy without creating an account.</>],
      ['How can I pay?', <>M-Pesa, Visa or Mastercard. Payments are processed by Paystack; PrimeTickets never sees your card number or M-Pesa PIN.</>],
      ['What is the service fee?', <>A 5% service fee is added to the ticket price at checkout. You see the full total before you pay.</>],
      ['I paid but did not get a ticket.', <>Tickets are emailed within a minute or two. Check your spam folder first. If you have an account, your ticket is also under <Link to="/my-tickets" className="text-primary-600 font-semibold hover:underline">My Tickets</Link>. Still missing? Email us your order reference or M-Pesa code and we will sort it out.</>],
    ],
  },
  {
    group: 'Your ticket',
    items: [
      ['Where is my ticket?', <>In the confirmation email, as a QR code. If you bought while signed in, it is also under <Link to="/my-tickets" className="text-primary-600 font-semibold hover:underline">My Tickets</Link>, where you can download it as an image.</>],
      ['How do I get in at the door?', <>Show the QR code on your phone or a printout. Staff scan it once. A ticket for several people can be scanned until everyone it admits has entered.</>],
      ['Can I share a screenshot of my ticket?', <>Please do not. Each ticket is accepted only once, so if someone else uses a copy first, yours will be refused.</>],
    ],
  },
  {
    group: 'Changing your plans',
    items: [
      ['Can I give my ticket to a friend?', <>Yes. Under My Tickets choose <strong>Transfer</strong> and enter your friend's email. They need a PrimeTickets account with that email. The ticket moves to them straight away and yours stops working.</>],
      ['Can I resell my ticket?', <>Yes, on the <Link to="/market" className="text-primary-600 font-semibold hover:underline">Resale Market</Link>. Under My Tickets choose <strong>Sell</strong> and set a price, up to 150% of what you paid. When someone buys it they receive a new ticket and yours is cancelled. You can cancel the listing any time before it sells.</>],
      ['Can I get a refund?', <>See our <Link to="/refunds" className="text-primary-600 font-semibold hover:underline">refund policy</Link>.</>],
    ],
  },
  {
    group: 'Your account',
    items: [
      ['Do I need an account?', <>No, but an account keeps all your tickets in one place and lets you transfer, resell and download them.</>],
      ['I forgot my password.', <>Use <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">Forgot password</Link> and we will email you a reset link. You can also sign in with Google.</>],
    ],
  },
  {
    group: 'Event organisers',
    items: [
      ['How do I sell tickets for my event?', <><Link to="/vendor/register" className="text-primary-600 font-semibold hover:underline">Create an organiser account</Link>, add your event with its prices and ticket numbers, and share the event link.</>],
      ['How do I check people in?', <>Sign in on any phone and open <Link to="/checkin" className="text-primary-600 font-semibold hover:underline">Door Check-in</Link>. Point the camera at each ticket's QR code. Used and invalid tickets are flagged immediately.</>],
    ],
  },
];

export default function Help() {
  return (
    <InfoLayout
      title="Help centre"
      intro="Answers to the questions we hear most. If yours is not here, get in touch."
      current="/help"
    >
      {FAQ.map(({ group, items }) => (
        <Section key={group} title={group}>
          {items.map(([q, a]) => (
            <details key={q} className="group border border-gray-100 rounded-xl bg-gray-50 open:bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-gray-800 flex items-center justify-between gap-3">
                {q}
                <span className="text-primary-600 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-4 pb-4 text-gray-600">{a}</p>
            </details>
          ))}
        </Section>
      ))}

      <Section title="Still need help?">
        <p>
          Email <SupportEmail /> with your order reference, or use the chat button at the bottom
          of any page.
        </p>
      </Section>
    </InfoLayout>
  );
}
