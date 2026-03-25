import AdminChatInbox from '../../components/chat/AdminChatInbox';

export default function AdminChat() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Live Chat</h1>
        <p className="text-gray-500">Real-time support conversations with visitors</p>
      </div>
      <div className="flex-1 min-h-0">
        <AdminChatInbox />
      </div>
    </div>
  );
}
