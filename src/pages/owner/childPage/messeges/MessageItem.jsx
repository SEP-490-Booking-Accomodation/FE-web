import { useState } from "react"
import styles from "./Messages.module.scss"

export default function MessageItem({ message, isCurrentUser }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return ""

    const date = new Date(timestamp)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Debug the message object


  return (
    <div className={`${styles.message} ${isCurrentUser ? styles.user : styles.other}`}>
      {/* Show username for non-current user */}
      {!isCurrentUser && message.sender && (
        <div className={styles.messageUsername}>{message.sender.username || "Unknown"}</div>
      )}

      {/* Show message image if exists */}
      {message.image_url && (
        <img src={message.image_url || "/placeholder.svg"} alt="Attachment" className={styles.messageImage} />
      )}

      {/* Show message content */}
      {message.content && <p className={styles.messageContent}>{message.content}</p>}

      {/* Show timestamp */}
      <span className={styles.messageTime}>{formatTime(message.created_at)}</span>
    </div>
  )
}

