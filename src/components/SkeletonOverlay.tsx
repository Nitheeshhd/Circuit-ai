import React from "react";
import { motion } from "motion/react";

export const SkeletonOverlay: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-[#071011]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
  >
    <div className="w-full max-w-lg space-y-4">
      <div className="h-6 bg-[#202628] rounded-full animate-pulse w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-[#202628] rounded-full animate-pulse" />
        <div className="h-4 bg-[#202628] rounded-full animate-pulse w-5/6" />
        <div className="h-4 bg-[#202628] rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  </motion.div>
);
