import React from 'react';
import { ChatBot } from '../ChatBot';
import { motion } from 'motion/react';

export const AiPage: React.FC = () => {
  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <ChatBot />
    </motion.div>
  );
};
