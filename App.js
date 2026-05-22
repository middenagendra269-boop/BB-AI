import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// FIX: EXPO_PUBLIC_ prefix mandatory for EAS Build
const GROQ_KEY = process.env.GROQ_KEY;

export default function App() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([
    { role: 'assistant', text: 'Hey Bobby! Nenu BB AI ni 🤖 Emi adagali?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const askBB = async () => {
    if (!input.trim()) return;
    
    // FIX: Check if API key exists
    if (!GROQ_KEY) {
      Alert.alert(
        "API Key Error", 
        "Groq API key ledu ra. Expo Secrets lo EXPO_PUBLIC_GROQ_KEY add chesava?"
      );
      return;
    }

    const userMsg = { role: 'user', text: input.trim() };
    const currentInput = input.trim();
    setChat(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { 
              role: 'system', 
              content: 'Nuvvu BB AI vi. Telugu lo friendly ga, konchem comedy tho, helpful ga matladu. User peru Bobby.' 
            },
           ...chat.map(m => ({ 
              role: m.role === 'assistant'? 'assistant' : 'user', 
              content: m.text 
            })),
            { role: 'user', content: currentInput }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await res.json();
      
      // FIX: Groq error handling
      if (data.error) {
        Alert.alert("Groq Error", data.error.message || "API call failed");
        setChat(prev => prev.slice(0, -1)); // Remove user msg if failed
        return;
      }

      if (!data.choices ||!data.choices[0]) {
        Alert.alert("Error", "AI nunchi reply raledhu");
        setChat(prev => prev.slice(0, -1));
        return;
      }

      const aiMsg = { role: 'assistant', text: data.choices[0].message.content };
      setChat(prev => [...prev, aiMsg]);
      
    } catch (err) {
      Alert.alert("Network Error", err.message || "Internet check chey ra");
      setChat(prev => prev.slice(0, -1)); // Remove user msg if failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios'? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerText}>BB AI 👑</Text>
      </View>

      <ScrollView 
        style={styles.chatContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chat.map((msg, index) => (
          <View key={index} style={[
            styles.messageBubble, 
            msg.role === 'user'? styles.userBubble : styles.aiBubble
          ]}>
            <Text style={[
              styles.messageText,
              msg.role === 'user'? styles.userText : styles.aiText
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Text style={styles.aiText}>BB AI typing... 🤔</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message BB AI..."
          placeholderTextColor="#888"
          multiline
          editable={!loading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
          onPress={askBB}
          disabled={loading ||!input.trim()}
        >
          <Text style={styles.sendButtonText}>{loading? '⏳' : '🚀'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    color: '#00ff88',
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#00ff88',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#2a2a2a',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#000',
  },
  aiText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#00ff88',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
  sendButtonText: {
    fontSize: 20,
  },
});
