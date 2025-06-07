"use client";

import { useState, useEffect } from "react";
import { FaCommentDots } from "react-icons/fa";
import styles from "./Messages.module.scss";
import ChatList from "./ChatList";
import ChatBox from "./ChatBox";
import ChatInput from "./ChatInput";
import { supabase } from "../../../../redux/services/supabase";
import { useCreateNotificationMutation } from "../../../../redux/services/notificationApi";

export default function Messages() {
  const chatInfo = JSON.parse(localStorage.getItem("chat_info"));
  const [createNotification] = useCreateNotificationMutation();

  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState([]);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkUserExist = async (userId, username) => {
    if (!userId || !username) {
      console.error("User ID or username is missing");
      return;
    }
    try {
      const { data: existingUser, error } = await supabase
        .from("profiles")
        .select("id, iduserplatform, username, is_online, last_seen")
        .eq("iduserplatform", userId)
        .single();
      if (existingUser) {
        console.log("User already exists:", existingUser);
        //update user online status
        localStorage.setItem(
          "chat_info",
          JSON.stringify({
            id: existingUser.id,
            username: existingUser.username,
          })
        );

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_online: true, last_seen: new Date() })
          .eq("iduserplatform", userId);
        if (updateError) {
          console.error("Error updating user status:", updateError);
        } else {
          console.log("User status updated successfully");
        }
      }

      //if user does not exist, create a new user
      if (error && error.code === "PGRST116") {
        const { data: newUser, error: createError } = await supabase
          .from("profiles")
          .insert({
            iduserplatform: userId,
            username: username,
            is_online: true,
            last_seen: new Date(),
            role: true,
          })
          .select()
          .single();
        if (createError) {
          console.error("Error creating user:", createError);
        } else {
          console.log("New user created successfully:", newUser);
          localStorage.setItem(
            "chat_info",
            JSON.stringify({
              id: newUser.id,
              username: newUser.username,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
    }
  };

  const fetchChatList = async () => {
    if (!chatInfo) {
      console.error("Chat info is missing");
      return;
    }
    try {
      // Fetch chat IDs where the user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", chatInfo.id);

      if (participantError) {
        console.error("Error fetching participant data:", participantError);
        return;
      }
      if (!participantData || participantData.length === 0) {
        console.log("No chat participants found");
        setChat([]);
        return;
      }

      const chatIds = participantData.map((participant) => participant.chat_id);

      // Fetch chats with participant details including username from profiles
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select(
          `
          id,
          created_at,
          updated_at,
          chat_participants (
            user_id,
            profiles (
              id,
              username,
              is_online,
              last_seen
            )
          )
        `
        )
        .in("id", chatIds)
        .order("updated_at", { ascending: false });

      if (chatError) {
        console.error("Error fetching chat data:", chatError.message);
        return;
      }

      const formattedChatData = chatData.map((chat) => ({
        id: chat.id,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        participants: chat.chat_participants.map((participant) => ({
          id: participant.user_id,
          username: participant.profiles.username,
          is_online: participant.profiles.is_online,
          last_seen: participant.profiles.last_seen,
        })),
      }));

      setChat(formattedChatData);

      // Fetch messages for the first chat if available
      if (formattedChatData.length > 0 && !selectedChat) {
        const firstChat = formattedChatData[0];
        fetchMessages(firstChat.id);
        setSelectedChat(firstChat);
      }
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    if (!chatId) return;

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(
          `
          id, 
          user_id, 
          content, 
          created_at, 
          status, 
          read_by,
          profiles:user_id(username)
        `
        )
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError.message);
        return;
      }

      // Format messages with sender information
      const formattedMessages = messagesData.map((message) => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        status: message.status,
        read_by: message.read_by,
        sender: {
          id: message.user_id,
          username: message.profiles?.username || "Unknown",
        },
        isCurrentUser: message.user_id === chatInfo?.id,
      }));

      setMessages(formattedMessages || []);

      // Mark messages as read
      if (formattedMessages.length > 0) {
        markMessagesAsRead(chatId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (chatId) => {
    if (!chatInfo || !chatId) return;

    try {
      // First, fetch all messages in this chat that weren't sent by the current user
      const { data: messagesToCheck, error: fetchError } = await supabase
        .from("messages")
        .select("id, read_by")
        .eq("chat_id", chatId)
        .neq("user_id", chatInfo.id);

      if (fetchError) {
        console.error("Error fetching messages to mark as read:", fetchError);
        return;
      }

      // Check each message and update it if the current user hasn't read it yet
      for (const message of messagesToCheck || []) {
        // Skip if the user is already in read_by
        if (
          Array.isArray(message.read_by) &&
          message.read_by.includes(chatInfo.id)
        ) {
          continue;
        }

        // Add current user to read_by array
        const updatedReadBy = Array.isArray(message.read_by)
          ? [...message.read_by, chatInfo.id]
          : [chatInfo.id];

        const { error: updateError } = await supabase
          .from("messages")
          .update({
            read_by: updatedReadBy,
            status: "read",
          })
          .eq("id", message.id);

        if (updateError) {
          console.error(
            `Error marking message ${message.id} as read:`,
            updateError
          );
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async ({ content, image_url }) => {
    if (!selectedChat || !chatInfo || (!content && !image_url)) return;
    console.log(selectedChat.id)
    console.log(chatInfo.id)
    try {
      // Get receiver information
      const { data: receiverData, error: receiverError } = await supabase
        .from('chat_participants')
        .select('user_id, profiles ( iduserplatform )')
        .eq('chat_id', selectedChat.id)
        .neq('user_id', chatInfo.id)
        .maybeSingle();

      if (receiverError) {
        console.error("Error fetching receiver:", receiverError);
        return;
      }

      // Insert message into database (without image_url for now)
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: selectedChat.id,
          user_id: chatInfo.id,
          content: content || "",
          status: "sent",
          read_by: [chatInfo.id], // Mark as read by sender
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      // Update chat's updated_at timestamp
      const { error: updateError } = await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedChat.id);

      if (updateError) {
        console.error("Error updating chat timestamp:", updateError);
      }

      // Create notification for receiver
      if (receiverData) {
        try {
          const notification = {
            userId: receiverData.profiles.iduserplatform,
            title: "New Message",
            content: content || "You have received a new message",
            isRead: false,
            type: 6
          };
          
          // Call notification API
          await createNotification(notification).unwrap();
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
        }
      }

      // Optimistically update UI
      const newMessage = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        status: data.status,
        read_by: data.read_by,
        sender: {
          id: chatInfo.id,
          username: chatInfo.username,
        },
        isCurrentUser: true,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const username = localStorage.getItem("username");

    const initializeChat = async () => {
      await checkUserExist(userId, username);
      await fetchChatList();
    };

    initializeChat();

    // Set up real-time subscription for new messages
    const messageSubscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          console.log("New message received:", payload);
          // Only fetch messages if the new message is not from the current user
          if (selectedChat && 
              payload.new.chat_id === selectedChat.id && 
              payload.new.user_id !== chatInfo.id) {
            fetchMessages(selectedChat.id);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    // Set up real-time subscription for chat list updates
    const chatSubscription = supabase
      .channel("chats-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          console.log("Chat table updated, refreshing chat list");
          fetchChatList();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_participants" },
        () => {
          console.log("Chat participants updated, refreshing chat list");
          fetchChatList();
        }
      )
      .subscribe((status) => {
        console.log("Chat subscription status:", status);
      });

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(chatSubscription);
    };
  }, [selectedChat]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  return (
    <div className={styles.chatContainer}>
      {mobileView && selectedChat ? (
        // Mobile view with selected chat
        <div className={styles.chatContent}>
          <div
            className={styles.mobileBackButton}
            onClick={() => setSelectedChat(null)}
          >
            ← Back to chats
          </div>
          <ChatBox
            selectedChat={selectedChat}
            messages={messages}
            currentUserId={chatInfo?.id}
          />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      ) : mobileView ? (
        // Mobile view with chat list
        <ChatList
          chats={chat}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          currentUserId={chatInfo?.id}
        />
      ) : (
        // Desktop view with both panels
        <>
          <ChatList
            chats={chat}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            currentUserId={chatInfo?.id}
          />

          <div className={styles.chatContent}>
            {selectedChat ? (
              <>
                <ChatBox
                  selectedChat={selectedChat}
                  messages={messages}
                  currentUserId={chatInfo?.id}
                />
                <ChatInput onSendMessage={handleSendMessage} />
              </>
            ) : (
              <div className={styles.emptyState}>
                <FaCommentDots />
                <h3>Select a conversation</h3>
                <p>Choose a chat from the list or start a new conversation</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
