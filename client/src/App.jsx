import { useEffect, useState } from 'react';
import { socket } from './socket';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [privateMessage, setPrivateMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');

  useEffect(() => {
    const name = prompt('Enter your username:');
    setUsername(name);
    socket.emit('new-user', name);
  }, []);

  useEffect(() => {
    socket.on('chat-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('users-online', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user-typing', (name) => {
      setTypingUsers((prev) => [...new Set([...prev, name])]);
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== name));
      }, 3000);
    });

    socket.on('private-message', (data) => {
      alert(`📩 Private from ${data.from}: ${data.message}`);
    });

    return () => {
      socket.off('chat-message');
      socket.off('users-online');
      socket.off('user-typing');
      socket.off('private-message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('send-message', { message, username });
      setMessage('');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', username);
  };

  const sendPrivate = () => {
    socket.emit('private-message', {
      toSocketId: recipientId,
      from: username,
      message: privateMessage,
    });
    alert(`Sent private message to ${recipientId}`);
    setPrivateMessage('');
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Welcome, {username}</h2>

      <h3>Global Chat</h3>
      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid gray', padding: '0.5rem' }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.username}</strong> ({new Date(msg.timestamp).toLocaleTimeString()}): {msg.message}
          </div>
        ))}
      </div>

      <div>
        <input
          value={message}
          placeholder="Type message..."
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      <p>
        {typingUsers.length > 0 && `${typingUsers.join(', ')} typing...`}
      </p>

      <h3>Online Users</h3>
      <ul>
        {onlineUsers.map((user, i) => (
          <li key={i}>{user} ✅</li>
        ))}
      </ul>

      <h3>Private Message</h3>
      <input
        placeholder="Recipient Socket ID"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
      />
      <input
        placeholder="Your Message"
        value={privateMessage}
        onChange={(e) => setPrivateMessage(e.target.value)}
      />
      <button onClick={sendPrivate}>Send Private</button>
    </div>
  );
}

export default App;
