const LEVELS = [
  {
    num: 1, title: 'Building the Foundation', subtitle: 'Wrist strength, shoulder mobility, and core stability',
    exercises: [
      { key: 'wrist_heel_raises', name: 'Wrist Heel Raises', rx: '10 reps, hold last rep 10 sec', video: 'https://www.youtube.com/watch?v=Uo4qAzodPlM&t=2m25s', hasTimer: true },
      { key: 'fin_pushups', name: 'Fin Push-ups', rx: '10 reps, hold last rep 10 sec · 3–5 supersets', video: 'https://www.youtube.com/watch?v=Uo4qAzodPlM&t=2m47s', hasTimer: true },
      { key: 'desk_stretch_ext', name: 'Desk Stretch — External Rotation', rx: '10 pulses, then hold 1–2 min', video: 'https://www.youtube.com/watch?v=Toe5JOHztek', hasTimer: true },
      { key: 'overhead_desk', name: 'Overhead Desk Stretch', rx: '10 pulses, then hold 1–2 min', video: 'https://www.youtube.com/watch?v=G4wqA_e9r3I', hasTimer: true },
      { key: 'hang', name: 'Hang', rx: 'Accumulate 1 min (build to unbroken) · 3–5 sets', hasTimer: true },
      { key: 'protracted_plank', name: 'Protracted Plank', rx: 'Accumulate 1 min · 3–5 sets', hasTimer: true },
      { key: 'body_line_drill', name: 'Body-Line Drill', rx: 'Hold 30 sec (build to 1 min) · 3–5 sets', hasTimer: true },
    ],
    graduation: 'Complete 5 sets of protracted plank 1 min, hang 1 min, and body-line drill 30 sec. All sets should feel relatively comfortable.'
  },
  {
    num: 2, title: 'Going Upside Down', subtitle: 'Chest-to-wall, hollow body, loading weight through shoulders',
    exercises: [
      { key: 'wrist_fin_2', name: 'Wrist Heel Raises + Fin Push-ups', rx: '10 reps each, hold last rep 10 sec · 3–5 supersets', video: 'https://www.youtube.com/watch?v=Uo4qAzodPlM&t=14s', hasTimer: true },
      { key: 'desk_hang_2', name: 'Desk Stretches + Hang', rx: '10 pulses + hold; 1 min hang · 3–5 sets', hasTimer: true },
      { key: 'chest_to_wall', name: 'Chest-to-Wall Handstand', rx: 'Accumulate 1 min (build to unbroken) · 3–5 sets', video: 'https://www.youtube.com/watch?v=f1yLxNMq23A', hasTimer: true },
      { key: 'hollow_body', name: 'Hollow Body Hold', rx: 'Accumulate 1 min · 3–5 sets', hasTimer: true },
    ],
    graduation: 'Complete 5 sets of chest-to-wall 1 min, hang 1 min, and hollow body 1 min. All sets should feel relatively comfortable.'
  },
  {
    num: 3, title: 'Learning to Balance', subtitle: 'Heel pulls, toe pulls, and the balance game',
    exercises: [
      { key: 'wrist_fin_3', name: 'Wrist Heel Raises + Fin Push-ups', rx: '10 reps each, hold last rep 10 sec · 3–5 supersets', video: 'https://www.youtube.com/watch?v=Uo4qAzodPlM&t=14s', hasTimer: true },
      { key: 'desk_hang_3', name: 'Desk Stretches + Hang', rx: '1 min unbroken hang · 3–5 sets', hasTimer: true },
      { key: 'heel_pulls', name: 'Heel Pulls', rx: '8–12 reps', video: 'https://www.youtube.com/watch?v=xm26KPUA7OI' },
      { key: 'toe_pulls', name: 'Toe Pulls', rx: '8–12 reps · 5 sets (heel + toe per set)', video: 'https://www.youtube.com/watch?v=IBnOiDCXVKs' },
      { key: 'box_balance', name: 'Box-Assisted Balance Game', rx: '10-minute practice block', video: 'https://youtu.be/huCWZYfvVYY', hasTimer: true },
      { key: 'ctw_3', name: 'Chest-to-Wall Handstand', rx: '1 min unbroken · 3–5 sets', video: 'https://www.youtube.com/watch?v=f1yLxNMq23A', hasTimer: true },
    ],
    graduation: 'Can find freestanding balance consistently for 3 to 5 seconds.'
  },
  {
    num: 4, title: 'Finding the Hold', subtitle: 'Extended balance work and freestanding kick-ups',
    exercises: [
      { key: 'wrist_fin_4', name: 'Wrist Heel Raises + Fin Push-ups', rx: '10 reps each, hold last rep 10 sec · 3–5 supersets', hasTimer: true },
      { key: 'desk_hang_4', name: 'Desk Stretches + Hang', rx: '1 min unbroken hang · 3–5 sets', hasTimer: true },
      { key: 'balance_game_15', name: '15-Minute Balance Game', rx: '15-minute practice block', video: 'https://youtu.be/huCWZYfvVYY', hasTimer: true },
      { key: 'ctw_4', name: 'Chest-to-Wall Handstand', rx: '1 min unbroken · 5 sets', video: 'https://www.youtube.com/watch?v=f1yLxNMq23A', hasTimer: true },
      { key: 'kickup', name: 'Kick-up Practice', rx: '10 per leg · 5–10 sets', video: 'https://youtu.be/7defUKA3D3w' },
    ],
    graduation: 'Can kick up and find balance consistently for 10 to 15 seconds.'
  },
  {
    num: 5, title: 'Building Endurance', subtitle: 'Consistency, shoulder taps, and extending hold duration',
    exercises: [
      { key: 'wrist_fin_5', name: 'Wrist Heel Raises + Fin Push-ups', rx: '10 reps each, hold last rep 10 sec · 3–5 supersets', hasTimer: true },
      { key: 'desk_hang_5', name: 'Desk Stretches + Hang', rx: '1 min unbroken hang · 3–5 sets', hasTimer: true },
      { key: 'ctw_5', name: 'Chest-to-Wall Handstand', rx: '1 min unbroken · 5 sets', video: 'https://www.youtube.com/watch?v=f1yLxNMq23A', hasTimer: true },
      { key: 'kickup_5', name: 'Kick-up Practice', rx: '10 per leg · 5–10 sets', video: 'https://youtu.be/7defUKA3D3w' },
      { key: 'shoulder_tap', name: 'Handstand Shoulder Tap', rx: '5 taps per side · 3–5 sets' },
    ],
    graduation: 'Have a consistent handstand of 30+ seconds but have not yet achieved a 60-second hold.'
  },
  {
    num: 6, title: 'The 60-Second Handstand', subtitle: 'The grind — chase the minute',
    exercises: [
      { key: 'freestanding', name: 'Freestanding Handstand', rx: '1 min freestanding · 5 rounds (1 min work / 1 min rest)', video: 'https://youtu.be/fBiYbkG_Uqk', hasTimer: true },
    ],
    graduation: 'Record a 60-second freestanding handstand on video. Congratulations — you have earned your handstand.'
  },
];

module.exports = LEVELS;
