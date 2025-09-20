import React, { useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseStorage, limitsStorage } from '../utils/storage';
import { calculateCategorySpending, calculateLimitProgress } from '../utils/analytics';
import { generateAdvice, ChatMessage } from '../utils/ai';
import { Send, Bot, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Need quick budgeting help? Ask me anything!' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const expenses = useMemo(() => (user ? expenseStorage.getAll(user.id) : []), [user]);
  const limits = useMemo(() => (user ? limitsStorage.getAll(user.id) : []), [user]);

  const summary = useMemo(() => {
    const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount, 0);
    const topCategories = calculateCategorySpending(expenses)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2);
    const limitsProgress = calculateLimitProgress(expenses, limits);
    const avgDaily = expenses.length > 0 ? totalThisMonth / new Date().getDate() : 0;
    return { totalThisMonth, avgDaily, topCategories, limitsProgress };
  }, [expenses, limits]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const reply = await generateAdvice(newMessages.filter(m => m.role !== 'system'), {
        monthlyBudget: user.monthlyBudget,
        summary,
      });
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to get advice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Assistant</span>
        </button>
      )}

      {open && (
        <div className="w-80 h-96 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Bot className="h-4 w-4 mr-1" /> Budget Assistant
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700 text-sm">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'assistant' ? '' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'assistant' ? 'bg-gray-50 border border-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
