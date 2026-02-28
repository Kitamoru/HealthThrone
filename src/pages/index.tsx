<div className="flex justify-center w-full">
  <motion.button
    whileHover={{ scale: isQuestionsLoading ? 1 : 1.05 }}
    whileTap={{ scale: isQuestionsLoading ? 1 : 0.95 }}
    className="accept-button"
    onClick={handleOpenSurveyModal}
    disabled={isQuestionsLoading}
  >
    {isQuestionsLoading
      ? "⚔️ Мудрец готовит испытание..."
      : "Пройти ежедневное испытание"}
  </motion.button>
</div>

<div className="flex justify-center w-full">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="accept-button"
    onClick={() => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.openLink('https://dnd-runner.vercel.app');
      } else {
        window.open('https://dnd-runner.vercel.app', '_blank');
      }
    }}
  >
    ⚔️ Играть в PixelDungeon
  </motion.button>
</div>
