"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaCommentDots } from "react-icons/fa"
import styles from "./Messages.module.scss"

export default function ChatList({ chats, selectedChat, onSelectChat, currentUserId }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredChats, setFilteredChats] = useState(chats || [])

  useEffect(() => {
    if (!chats) return

    if (searchTerm.trim() === "") {
      setFilteredChats(chats)
    } else {
      const filtered = chats.filter(
        (chat) =>
          chat.participants.some((p) => 
            p.username?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
      setFilteredChats(filtered)
    }
  }, [searchTerm, chats])

  // Function to get initials from username
  const getInitials = (username) => {
    if (!username) return "?"
    return username
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Function to get other participant(s) in a chat
  const getOtherParticipants = (chat) => {
    if (!chat.participants || !currentUserId) return []
    return chat.participants.filter((p) => p.id !== currentUserId)
  }

  // Function to get chat display name
  const getChatDisplayName = (chat) => {
    const others = getOtherParticipants(chat)
    if (others.length === 0) return "Chat"
    return others[0].username || "Unknown User"
  }

  return (
    <div className={styles.chatList}>
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {filteredChats.length > 0 ? (
        filteredChats.map((chat) => {
          const otherParticipants = getOtherParticipants(chat)
          const isOnline = otherParticipants.some((p) => p.is_online)
          const displayName = getChatDisplayName(chat)

          return (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${selectedChat && selectedChat.id === chat.id ? styles.activeChat : ""}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className={styles.avatar}>{getInitials(displayName)}</div>
              {isOnline && <div className={styles.onlineStatus}></div>}

              <div className={styles.chatInfo}>
                <p className={styles.chatName}>{displayName}</p>
                <p className={styles.chatLastMessage}>{chat.lastMessage || "Start a conversation"}</p>
              </div>
            </div>
          )
        })
      ) : (
        <div className={styles.emptyState}>
          <FaCommentDots />
          <h3>No conversations found</h3>
          <p>Try a different search or start a new conversation</p>
        </div>
      )}
    </div>
  )
}

