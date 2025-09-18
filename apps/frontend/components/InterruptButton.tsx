'use client';

import { motion } from 'framer-motion';

type InterruptButtonProps = {
  onClick: () => void;
};

const InterruptButton = ({ onClick }: InterruptButtonProps) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-500"
  >
    Interrupt
  </motion.button>
);

export default InterruptButton;
