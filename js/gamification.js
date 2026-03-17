/* =========================================================
   gamification.js — XP, levels, streaks, badges
   ========================================================= */

const Gamification = (() => {
  const { $, formatXP, xpInLevel, levelFromXP } = Utils;

  /* ---------- update header stats ---------- */
  const refreshHeader = () => {
    const p = Storage.getProgress();

    const lvlEl = $('#header-level');
    const xpEl = $('#header-xp');
    const streakEl = $('#header-streak');
    const barEl = $('#xp-bar-fill');

    if (lvlEl) lvlEl.textContent = `Lv ${p.level}`;
    if (xpEl) xpEl.textContent = `${formatXP(p.xp)} XP`;
    if (streakEl) streakEl.textContent = p.streak > 0 ? `🔥 ${p.streak}` : '';
    if (barEl) barEl.style.width = `${xpInLevel(p.xp)}%`;
  };

  /* ---------- award XP with toast ---------- */
  const awardXP = (amount, reason = '') => {
    const p = Storage.addXP(amount);
    Utils.toast(`+${amount} XP${reason ? ' — ' + reason : ''}`, 'success', 2000);
    refreshHeader();
    return p;
  };

  /* ---------- check streak on load ---------- */
  const checkStreak = () => {
    Storage.updateStreak();
    refreshHeader();
  };

  /* ---------- badge definitions (Phase 6 will expand) ---------- */
  const BADGES = [
    { id: 'first_lesson', name: 'First Steps', desc: 'Complete your first lesson', icon: '🌱' },
    { id: 'five_quizzes', name: 'Quiz Whiz', desc: 'Complete 5 quizzes', icon: '⚡' },
    { id: 'streak_3', name: 'On Fire', desc: '3 day streak', icon: '🔥' },
    { id: 'streak_7', name: 'Week Warrior', desc: '7 day streak', icon: '⚔️' },
    { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '⭐' },
    { id: 'all_su1', name: 'Class Master', desc: 'Complete all of Unit 1', icon: '🏅' }
  ];

  const getBadges = () => BADGES;

  return { refreshHeader, awardXP, checkStreak, getBadges };
})();
