export interface DailyQuote {
  id: string;
  text: { en: string; vi: string; zh: string; ko: string; [key: string]: string };
  author: { en: string; vi: string; zh: string; ko: string; [key: string]: string };
}

export const QUOTES: DailyQuote[] = [
  {
    id: "q1",
    text: {
      en: "Great things are done by a series of small things brought together.",
      vi: "Những điều lớn lao được tạo nên từ một chuỗi những điều nhỏ bé được kết hợp lại.",
      zh: "伟大的事业是由一系列小事聚集而成的。",
      ko: "위대한 일은 작은 일들이 모여 이루어진다."
    },
    author: { en: "Vincent Van Gogh", vi: "Vincent Van Gogh", zh: "文森特·梵高", ko: "빈센트 반 고흐" }
  },
  {
    id: "q2",
    text: {
      en: "Success is the sum of small efforts, repeated day in and day out.",
      vi: "Thành công là tổng hòa của những nỗ lực nhỏ bé, được lặp đi lặp lại ngày này qua ngày khác.",
      zh: "成功是日复一日重复的小小努力的总和。",
      ko: "성공은 매일매일 반복되는 작은 노력들의 합이다."
    },
    author: { en: "Robert Collier", vi: "Robert Collier", zh: "罗伯特·科利尔", ko: "로버트 콜리어" }
  },
  {
    id: "q3",
    text: {
      en: "You don't have to see the whole staircase, just take the first step.",
      vi: "Bạn không cần phải nhìn thấy toàn bộ cầu thang, chỉ cần đi bước đầu tiên.",
      zh: "你不必看到整个楼梯，只需迈出第一步。",
      ko: "계단 전체를 볼 필요는 없다. 그저 첫 걸음을 내딛어라."
    },
    author: { en: "Martin Luther King Jr.", vi: "Martin Luther King Jr.", zh: "马丁·路德·金", ko: "마틴 루터 킹 목사" }
  },
  {
    id: "q4",
    text: {
      en: "The secret of getting ahead is getting started.",
      vi: "Bí quyết để tiến lên phía trước là hãy bắt đầu.",
      zh: "取得进展的秘诀在于开始。",
      ko: "앞서가는 비결은 시작하는 것이다."
    },
    author: { en: "Mark Twain", vi: "Mark Twain", zh: "马克·吐温", ko: "마크 트웨인" }
  },
  {
    id: "q5",
    text: {
      en: "Focus on being productive instead of busy.",
      vi: "Hãy tập trung vào việc hiệu quả thay vì bận rộn.",
      zh: "专注于高效，而不是忙碌。",
      ko: "바쁘기보다는 생산적인 일에 집중하라."
    },
    author: { en: "Tim Ferriss", vi: "Tim Ferriss", zh: "蒂姆·费里斯", ko: "팀 페리스" }
  },
  {
    id: "q6",
    text: {
      en: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
      vi: "Dân nghiệp dư ngồi chờ cảm hứng, còn chúng ta đứng dậy và bắt tay vào làm việc.",
      zh: "业余爱好者坐等灵感，而我们其他人则直接起步去工作。",
      ko: "아마추어는 영감이 떠오르기를 기다리지만, 우리는 그저 일어나서 일하러 간다."
    },
    author: { en: "Stephen King", vi: "Stephen King", zh: "斯蒂芬·金", ko: "스티븐 킹" }
  },
  {
    id: "q7",
    text: {
      en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
      vi: "Chúng ta là kết quả của những gì chúng ta làm đi làm lại. Do đó, xuất sắc không phải là một hành động mà là một thói quen.",
      zh: "我们重复做什么，我们就是什么。因此，卓越不是一种行为，而是一种习惯。",
      ko: "우리가 반복적으로 하는 행동이 바로 우리 자신이다. 따라서 탁월함은 행동이 아니라 습관이다."
    },
    author: { en: "Aristotle", vi: "Aristotle", zh: "亚里士多德", ko: "아리스토텔레스" }
  },
  {
    id: "q8",
    text: {
      en: "Your future is created by what you do today, not tomorrow.",
      vi: "Tương lai của bạn được tạo ra bởi những gì bạn làm hôm nay, chứ không phải ngày mai.",
      zh: "你的未来是由你今天做的事情创造的，而不是明天。",
      ko: "당신의 미래는 내일이 아니라 오늘 당신이 하는 일에 의해 창조된다."
    },
    author: { en: "Robert Kiyosaki", vi: "Robert Kiyosaki", zh: "罗伯特·清崎", ko: "로버트 기요사키" }
  },
  {
    id: "q9",
    text: {
      en: "Start where you are. Use what you have. Do what you can.",
      vi: "Bắt đầu ở nơi bạn đang đứng. Sử dụng những gì bạn có. Làm những gì bạn có thể.",
      zh: "从你所在的地方开始。利用你拥有的东西。做你能做的事。",
      ko: "지금 있는 곳에서 시작하라. 가진 것을 활용하라. 할 수 있는 일을 하라."
    },
    author: { en: "Arthur Ashe", vi: "Arthur Ashe", zh: "阿瑟·阿什", ko: "아서 애시" }
  },
  {
    id: "q10",
    text: {
      en: "If you spend too much time thinking about a thing, you'll never get it done.",
      vi: "Nếu bạn dành quá nhiều thời gian để suy nghĩ về một việc, bạn sẽ không bao giờ hoàn thành nó.",
      zh: "如果你花太多时间思考一件事，你永远也不会把它做完。",
      ko: "어떤 일에 대해 생각하는 데 너무 많은 시간을 보내면 결코 해낼 수 없다."
    },
    author: { en: "Bruce Lee", vi: "Bruce Lee", zh: "李小龙", ko: "이소룡" }
  },
  {
    id: "q11",
    text: {
      en: "Nothing is less productive than to make more efficient what should not be done at all.",
      vi: "Không có gì kém hiệu quả hơn việc làm cho hiệu quả hơn những việc vốn không nên làm.",
      zh: "没有什么比把根本不该做的事情做得更有效率更徒劳的了。",
      ko: "결코 하지 말아야 할 일을 효율적으로 하는 것만큼 비생산적인 일은 없다."
    },
    author: { en: "Peter Drucker", vi: "Peter Drucker", zh: "彼得·德鲁克", ko: "피터 드러커" }
  },
  {
    id: "q12",
    text: {
      en: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.",
      vi: "Sự đơn giản thu gọn lại ở hai bước: Xác định điều thiết yếu. Loại bỏ phần còn lại.",
      zh: "简单归结为两个步骤：确定本质。消除其余。",
      ko: "단순함은 두 가지 단계로 요약된다. 필수적인 것을 파악하라. 나머지는 제거하라."
    },
    author: { en: "Leo Babauta", vi: "Leo Babauta", zh: "里奥·巴伯塔", ko: "리오 바바우타" }
  },
  {
    id: "q13",
    text: {
      en: "Action is the foundational key to all success.",
      vi: "Hành động là chìa khóa nền tảng cho mọi thành công.",
      zh: "行动是所有成功的基石。",
      ko: "행동은 모든 성공의 기본 열쇠이다."
    },
    author: { en: "Pablo Picasso", vi: "Pablo Picasso", zh: "巴勃罗·毕加索", ko: "파블로 피카소" }
  },
  {
    id: "q14",
    text: {
      en: "One always has time enough, if one will apply it well.",
      vi: "Người ta luôn có đủ thời gian, nếu người ta sử dụng nó tốt.",
      zh: "只要善于利用，时间总是足够的。",
      ko: "잘 활용하기만 한다면 시간은 항상 충분하다."
    },
    author: { en: "Johann Wolfgang von Goethe", vi: "Johann Wolfgang von Goethe", zh: "约翰·沃尔夫冈·冯·歌德", ko: "요한 볼프강 폰 괴테" }
  },
  {
    id: "q15",
    text: {
      en: "Don't count the days, make the days count.",
      vi: "Đừng đếm những ngày, hãy làm cho những ngày trở nên đáng giá.",
      zh: "不要计算日子，要让日子有价值。",
      ko: "날짜를 세지 말고, 하루하루를 가치 있게 만들어라."
    },
    author: { en: "Muhammad Ali", vi: "Muhammad Ali", zh: "穆罕默德·阿里", ko: "무하마드 알리" }
  },
  {
    id: "q16",
    text: {
      en: "Productivity is never an accident. It is always the result of a commitment to excellence.",
      vi: "Hiệu suất không bao giờ là sự tình cờ. Nó luôn là kết quả của sự cam kết hướng tới sự xuất sắc.",
      zh: "卓越的生产力绝非偶然，它总是致力于追求卓越的结果。",
      ko: "생산성은 결코 우연이 아니다. 그것은 항상 탁월함에 대한 헌신의 결과이다."
    },
    author: { en: "Paul J. Meyer", vi: "Paul J. Meyer", zh: "保罗·J·迈耶", ko: "폴 J. 마이어" }
  },
  {
    id: "q17",
    text: {
      en: "Either you run the day or the day runs you.",
      vi: "Hoặc bạn điều khiển ngày hôm nay, hoặc nó sẽ điều khiển bạn.",
      zh: "要么你驾驭这一天，要么这一天驾驭你。",
      ko: "당신이 하루를 지배하거나, 하루가 당신을 지배하거나 둘 중 하나다."
    },
    author: { en: "Jim Rohn", vi: "Jim Rohn", zh: "吉姆·罗恩", ko: "짐 론" }
  },
  {
    id: "q18",
    text: {
      en: "It’s not always that we need to do more but rather that we need to focus on less.",
      vi: "Không phải lúc nào chúng ta cũng cần làm nhiều hơn, mà là chúng ta cần tập trung vào ít thứ hơn.",
      zh: "我们并非总是需要做更多，而是需要专注于更少的事情。",
      ko: "우리가 항상 더 많은 것을 해야 하는 것은 아니며, 오히려 더 적은 것에 집중해야 한다."
    },
    author: { en: "Nathan W. Morris", vi: "Nathan W. Morris", zh: "内森·W·莫里斯", ko: "네이선 W. 모리스" }
  },
  {
    id: "q19",
    text: {
      en: "The key is in not spending time, but in investing it.",
      vi: "Chìa khóa không nằm ở việc tiêu xài thời gian, mà là ở việc đầu tư nó.",
      zh: "关键不在于花费时间，而在于投资时间。",
      ko: "핵심은 시간을 쓰는 것이 아니라 투자하는 것이다."
    },
    author: { en: "Stephen R. Covey", vi: "Stephen R. Covey", zh: "斯蒂芬·R·柯维", ko: "스티븐 R. 코비" }
  },
  {
    id: "q20",
    text: {
      en: "Ordinary people think merely of spending time, great people think of using it.",
      vi: "Người bình thường chỉ nghĩ đến việc tiêu xài thời gian, những người vĩ đại nghĩ đến việc sử dụng nó.",
      zh: "普通人只想着如何消磨时间，而伟大的人想着如何利用时间。",
      ko: "평범한 사람들은 단지 시간을 보낼 생각을 하지만, 위대한 사람들은 시간을 활용할 생각을 한다."
    },
    author: { en: "Arthur Schopenhauer", vi: "Arthur Schopenhauer", zh: "阿瑟·叔本华", ko: "아르투르 쇼펜하우어" }
  },
  {
    id: "q21",
    text: {
      en: "You may delay, but time will not.",
      vi: "Bạn có thể trì hoãn, nhưng thời gian thì không.",
      zh: "你可以拖延，但时间不会。",
      ko: "당신은 지체할 수 있지만, 시간은 그렇지 않다."
    },
    author: { en: "Benjamin Franklin", vi: "Benjamin Franklin", zh: "本杰明·富兰克林", ko: "벤저민 프랭클린" }
  },
  {
    id: "q22",
    text: {
      en: "Absorb what is useful, discard what is useless and add what is specifically your own.",
      vi: "Hấp thụ những gì hữu ích, loại bỏ những gì vô ích và thêm vào những gì đặc biệt là của riêng bạn.",
      zh: "吸收有用的，丢弃无用的，加上你特有的。",
      ko: "유용한 것은 흡수하고 무용한 것은 버려라. 그리고 당신만의 고유한 것을 더하라."
    },
    author: { en: "Bruce Lee", vi: "Bruce Lee", zh: "李小龙", ko: "이소룡" }
  },
  {
    id: "q23",
    text: {
      en: "Do the hard jobs first. The easy jobs will take care of themselves.",
      vi: "Làm những việc khó trước. Những việc dễ sẽ tự lo được cho bản thân chúng.",
      zh: "先做困难的工作。容易的工作自会迎刃而解。",
      ko: "어려운 일부터 먼저 하라. 쉬운 일은 저절로 해결될 것이다."
    },
    author: { en: "Dale Carnegie", vi: "Dale Carnegie", zh: "戴尔·卡耐基", ko: "데일 카네기" }
  },
  {
    id: "q24",
    text: {
      en: "There is no substitute for hard work.",
      vi: "Không có gì thay thế được sự chăm chỉ.",
      zh: "努力工作是不可替代的。",
      ko: "노력을 대신할 수 있는 것은 없다."
    },
    author: { en: "Thomas Edison", vi: "Thomas Edison", zh: "托马斯·爱迪生", ko: "토마스 에디슨" }
  },
  {
    id: "q25",
    text: {
      en: "The best time to plant a tree was 20 years ago. The second best time is now.",
      vi: "Thời điểm tốt nhất để trồng cây là 20 năm trước. Thời điểm tốt thứ hai là ngay bây giờ.",
      zh: "种一棵树最好的时间是十年前，其次是现在。",
      ko: "나무를 심기에 가장 좋았던 때는 20년 전이다. 두 번째로 좋은 때는 바로 지금이다."
    },
    author: { en: "Chinese Proverb", vi: "Tục ngữ Trung Quốc", zh: "中国谚语", ko: "중국 속담" }
  },
  {
    id: "q26",
    text: {
      en: "By failing to prepare, you are preparing to fail.",
      vi: "Không chuẩn bị nghĩa là bạn đang chuẩn bị cho sự thất bại.",
      zh: "未能准备，就是在准备失败。",
      ko: "준비에 실패하는 것은 실패를 준비하는 것이다."
    },
    author: { en: "Benjamin Franklin", vi: "Benjamin Franklin", zh: "本杰明·富兰克林", ko: "벤저민 프랭클린" }
  },
  {
    id: "q27",
    text: {
      en: "Strive not to be a success, but rather to be of value.",
      vi: "Đừng phấn đấu để thành công, hãy phấn đấu để trở nên có giá trị.",
      zh: "不要努力成为一个成功者，而要努力成为一个有价值的人。",
      ko: "성공하는 사람이 되려 하지 말고, 가치 있는 사람이 되려고 노력하라."
    },
    author: { en: "Albert Einstein", vi: "Albert Einstein", zh: "阿尔伯特·爱因斯坦", ko: "알베르트 아인슈타인" }
  },
  {
    id: "q28",
    text: {
      en: "Eighty percent of success is showing up.",
      vi: "Tám mươi phần trăm của thành công là sự có mặt.",
      zh: "百分之八十的成功在于出席。",
      ko: "성공의 80%는 그 자리에 나타나는 것이다."
    },
    author: { en: "Woody Allen", vi: "Woody Allen", zh: "伍迪·艾伦", ko: "우디 앨런" }
  },
  {
    id: "q29",
    text: {
      en: "Continuous improvement is better than delayed perfection.",
      vi: "Cải tiến liên tục tốt hơn là sự hoàn hảo bị trì hoãn.",
      zh: "持续改进胜过迟来的完美。",
      ko: "지속적인 개선이 지연된 완벽함보다 낫다."
    },
    author: { en: "Mark Twain", vi: "Mark Twain", zh: "马克·吐温", ko: "마크 트웨인" }
  },
  {
    id: "q30",
    text: {
      en: "Small deeds done are better than great deeds planned.",
      vi: "Những việc nhỏ được hoàn thành tốt hơn là những việc lớn chỉ được lên kế hoạch.",
      zh: "完成小事胜过计划大事。",
      ko: "실행된 작은 일이 계획된 위대한 일보다 낫다."
    },
    author: { en: "Peter Marshall", vi: "Peter Marshall", zh: "彼得·马歇尔", ko: "피터 마셜" }
  }
];
