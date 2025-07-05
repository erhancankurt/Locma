import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Box, Paper, Typography, TextField, IconButton, List, ListItem, ListItemAvatar, Avatar, ListItemText, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface GroupChatProps {
  groupId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
}

interface Message {
  id: string;
  text: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  timestamp: any;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId, userId, displayName, photoURL }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
      text: input,
      userId,
      displayName,
      photoURL,
      timestamp: serverTimestamp(),
    });
    setInput('');
  };

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 2, background: '#f5faff', maxHeight: 320, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
        Grup Sohbeti
      </Typography>
      <List sx={{ flex: 1, overflowY: 'auto', mb: 1 }}>
        {messages.map(msg => (
          <ListItem key={msg.id} alignItems="flex-start" sx={{ px: 0 }}>
            <ListItemAvatar>
              <Avatar src={msg.photoURL} alt={msg.displayName} />
            </ListItemAvatar>
            <ListItemText
              primary={<span style={{ fontWeight: 600 }}>{msg.displayName || 'Kullanıcı'}</span>}
              secondary={<span style={{ color: '#333' }}>{msg.text}</span>}
            />
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>
      <Box component="form" onSubmit={sendMessage} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mesaj yaz..."
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" color="primary" disabled={!input.trim()}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Paper>
  );
};
