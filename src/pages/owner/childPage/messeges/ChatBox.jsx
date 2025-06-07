"use client"

import { useRef, useEffect } from "react"
import { FaInfoCircle } from "react-icons/fa"
import styles from "./Messages.module.scss"
import MessageItem from "./MessageItem"

export default function ChatBox({ selectedChat, messages, currentUserId }) {
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Get other participants
  const getOtherParticipants = () => {
    if (!selectedChat?.participants || !currentUserId) return []
    return selectedChat.participants.filter((p) => p.id !== currentUserId)
  }

  // Format participants for display
  const formatParticipants = () => {
    const others = getOtherParticipants()
    if (others.length === 0) return "Chat"
    return others[0].username || "Unknown User"
  }

  return (
    <div className={styles.chatBox}>
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <span>{formatParticipants()}</span>
          {getOtherParticipants().some((p) => p.is_online) && <span className={styles.onlineText}>• Online</span>}
        </div>
        <FaInfoCircle className={styles.infoIcon} />
      </div>

      <div className={styles.chatMessages} ref={messagesContainerRef}>
        {messages && messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isCurrentUser={msg.sender?.id === currentUserId || msg.isCurrentUser}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className={styles.noMessages}>No messages yet. Start the conversation!</div>
        )}
      </div>
    </div>
  )
}

