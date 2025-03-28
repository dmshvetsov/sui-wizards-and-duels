import { createContext, useContext, useEffect, useRef, useState } from 'react';
import supabase from '../supabaseClient';

const AppContext = createContext({});

const AppContextProvider = ({ children }) => {
  let myChannel = null;
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [routeHash, setRouteHash] = useState('');
  const [isOnBottom, setIsOnBottom] = useState(false);
  const [newIncomingMessageTrigger, setNewIncomingMessageTrigger] = useState(null);
  const [unviewedMessageCount, setUnviewedMessageCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(false);

  useEffect(() => {
    // Effect to scroll to bottom on initial message load
    if (isInitialLoad) {
      setIsInitialLoad(false);
      scrollToBottom();
    }
  }, [messages]);

  const randomUsername = () => {
    return `@user${Date.now().toString().slice(-4)}`;
  };

  const initializeUser = () => {
    let username = localStorage.getItem('username') || randomUsername();
    setUsername(username);
    localStorage.setItem('username', username);
  };

  useEffect(() => {
    initializeUser();
    getMessagesAndSubscribe();

    return () => {
      // Remove supabase channel subscription by useEffect unmount
      if (myChannel) {
        supabase.removeChannel(myChannel);
      }
    };
  }, []);

  useEffect(() => {
    if (!newIncomingMessageTrigger) return;

    if (newIncomingMessageTrigger.username === username) {
      scrollToBottom();
    } else {
      setUnviewedMessageCount((prevCount) => prevCount + 1);
    }
  }, [newIncomingMessageTrigger]);

  const handleNewMessage = (payload) => {
    setMessages((prevMessages) => [payload.new, ...prevMessages]);
    //* needed to trigger react state because I need access to the username state
    setNewIncomingMessageTrigger(payload.new);
  };

  const getInitialMessages = async () => {
    if (messages.length) return;

    const { data, error } = await supabase
      .from('messages')
      .select()
      .range(0, 49)
      .order('id', { ascending: false });

    setLoadingInitial(false);
    if (error) {
      setError(error.message);
      return;
    }

    setIsInitialLoad(true);
    setMessages(data);
  };

  const getMessagesAndSubscribe = async () => {
    setError('');

    await getInitialMessages();

    if (!myChannel) {
      myChannel = supabase
        .channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          handleNewMessage(payload);
        })
        .subscribe();
    }
  };

  const scrollRef = useRef();
  const onScroll = async ({ target }) => {
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 1) {
      setUnviewedMessageCount(0);
      setIsOnBottom(true);
    } else {
      setIsOnBottom(false);
    }

    //* Load more messages when reaching top
    if (target.scrollTop === 0) {
      const { data, error } = await supabase
        .from('messages')
        .select()
        .range(messages.length, messages.length + 49)
        .order('id', { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      target.scrollTop = 1;
      setMessages((prevMessages) => [...prevMessages, ...data]);
    }
  };

  const scrollToBottom = () => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  return (
    <AppContext.Provider
      value={{
        messages,
        loadingInitial,
        error,
        getMessagesAndSubscribe,
        username,
        setUsername,
        randomUsername,
        routeHash,
        scrollRef,
        onScroll,
        scrollToBottom,
        isOnBottom,
        unviewedMessageCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => useContext(AppContext);

export { AppContext as default, AppContextProvider, useAppContext };
