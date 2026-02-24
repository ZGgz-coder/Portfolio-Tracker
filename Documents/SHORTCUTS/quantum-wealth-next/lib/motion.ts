export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }
};

export const cardStagger = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};
