// 오픽(OPIc) 원버튼 답변 생성기 - 데이터
// 각 주제(topic)는 문항(item)들의 순서 있는 목록을 가지며,
// 각 문항은 { question: 질문 텍스트, sentences: [답변을 이루는 문장들] } 로 구성된다.
// sentences는 5~10개의 짧지만 구조화된 고급(AH~S급) 문장으로 작성되어,
// 한 번 터치할 때마다 한 문장씩 재생된다.

export const QTYPE_LABELS = {
  intro: "자기소개",
  description: "묘사",
  routine: "습관 / 일상",
  experience: "경험",
};

// 실전처럼 매번 새 문항을 만들기 위한 주제 / 문항 유형 풀.
// 아래 TOPICS는 생성이 실패했을 때 쓰는 오프라인 폴백으로만 남겨둔다.
export const QUESTION_TOPICS = [
  "introducing yourself",
  "the house or apartment you live in",
  "your neighborhood",
  "your family and who you live with",
  "your job and what you actually do at work",
  "the industry you work in and how it is changing",
  "watching movies or TV shows",
  "listening to music",
  "going to parks",
  "going to cafes and coffee shops",
  "cooking and food at home",
  "eating out at restaurants",
  "running, walking, or working out",
  "domestic travel in your own country",
  "traveling abroad",
  "planning trips and vacations",
  "shopping",
  "using the internet and smartphones",
  "social media",
  "technology changing daily life",
  "weather and seasons",
  "public transportation and getting around",
  "banks and handling money",
  "recycling and the environment",
  "health and staying in shape",
  "free time on weekends",
  "meeting friends and socializing",
  "holidays and celebrations",
  "reading books or news",
  "learning something new as an adult",
];

export const QUESTION_TYPES = [
  {
    id: "description",
    label: "묘사",
    brief: "Ask the speaker to describe the topic in detail - what it looks like, what makes it distinctive.",
  },
  {
    id: "routine",
    label: "습관",
    brief: "Ask about the speaker's typical routine around the topic - how often, when, what they usually do.",
  },
  {
    id: "experience",
    label: "경험",
    brief: "Ask for a specific memorable episode related to the topic - what happened, from beginning to end.",
  },
  {
    id: "comparison",
    label: "비교",
    brief:
      "Ask the speaker to compare how this was in the past versus how it is now, or to compare two things within the topic.",
  },
  {
    id: "issue",
    label: "이슈",
    brief:
      "Ask an abstract or opinion question about the topic - a social trend, a problem people face, or what the speaker thinks should change. This is the advanced-level question type.",
  },
  {
    id: "roleplay",
    label: "롤플레이",
    brief:
      "Give a short situation and have the speaker handle it out loud - asking someone questions, or explaining a problem and proposing solutions.",
  },
];

export const DEFAULTS = {
  name: "Alex",
  job: "a graduate student",
  city: "Seoul",
};

export const TOPICS = {
  self_intro: {
    label: "자기소개",
    items: {
      intro: {
        question: "Let's start the interview now. Could you introduce yourself, please?",
        sentences: [
          "Sure, I'd be glad to introduce myself before we get started.",
          "My name is {name}, and I'm currently {job}, based in {city}.",
          "If I had to sum up my personality in a few words, I'd say I'm curious, easygoing, and genuinely enjoy connecting with people from all walks of life.",
          "Outside of my daily responsibilities, I try to make the most of my downtime by catching up with close friends, exploring new spots around the city, or simply unwinding with a good book.",
          "I'd say one thing that sets me apart is how much I value learning something new, whether that's picking up a skill or just having a conversation that shifts my perspective a bit.",
          "Family and friendships mean a lot to me as well, so I make a conscious effort to stay close with the people who matter most, even when life gets busy.",
          "Anyway, that's a quick glimpse into who I am, and I'm looking forward to sharing more as we go along.",
        ],
      },
    },
  },

  house: {
    label: "집 / 거주지",
    items: {
      description: {
        question: "Please describe the place where you live. What does it look like?",
        sentences: [
          "Well, I currently live in a fairly spacious apartment in {city}, which I moved into a few years back after quite an extensive search.",
          "The layout is pretty practical—there are two bedrooms, a bright living room, and a kitchen that I've gradually made my own over time.",
          "What really stands out, though, is the amount of natural light that pours in through the living room windows every morning, which honestly sets the tone for my whole day.",
          "If I had to pick a favorite corner of the house, it would definitely be that living room, since that's where I unwind with a cup of tea after a long day.",
          "Beyond the interior, what really sold me on this place was the location—it's just a short walk from the subway, and there's a quiet little park nearby where I can clear my head whenever I need a break.",
          "It's not the biggest place in the world, but it's cozy, well-organized, and it genuinely feels like a space that reflects who I am.",
          "All things considered, I couldn't be happier with where I've ended up living.",
        ],
      },
      routine: {
        question: "What do you usually do at home on a typical day?",
        sentences: [
          "On a fairly typical day, I usually start by straightening up my room and tackling a few small chores, like the dishes or the laundry, before I head out the door.",
          "Once I'm back in the evening, I like to whip up something simple for dinner, since cooking helps me unwind after a long day.",
          "After that, I'll usually wind down by watching a show or catching up on messages until it's time to call it a night.",
          "Weekends, though, are a completely different story—that's when I really roll up my sleeves and give the whole place a proper deep clean, from vacuuming the carpets to reorganizing the closets.",
          "I also try to set aside some time on weekends to rearrange a few things around the house, just to keep the space feeling fresh.",
          "So, between the weekday routine and the weekend deep clean, I'd say I keep my place fairly well maintained.",
        ],
      },
      experience: {
        question:
          "Tell me about a memorable experience related to your home, such as moving in or a specific incident that happened there.",
        sentences: [
          "One experience that really sticks with me is the day I moved into my current apartment.",
          "Looking back, it was honestly a bit chaotic—I'd drastically underestimated just how many boxes I'd accumulated over the years.",
          "I ended up spending the entire day unpacking and sorting through everything, which was far more exhausting than I'd anticipated.",
          "Thankfully, a few close friends showed up to lend a hand, and without them, I don't think I would have finished before midnight.",
          "Once we were finally done, we ended up ordering way too much pizza to celebrate, which felt like the perfect way to wrap up such a hectic day.",
          "I remember being utterly drained by that point, but there was something deeply satisfying about watching all my belongings finally settle into a space that felt like home.",
          "Even now, whenever I think back on that day, it reminds me of just how much effort—and how many good friends—it took to make this place feel like mine.",
        ],
      },
    },
  },

  movie: {
    label: "영화 보기",
    items: {
      description: {
        question: "What kind of movies do you enjoy watching, and where do you usually watch them?",
        sentences: [
          "Watching movies is honestly one of my go-to hobbies whenever I have some downtime.",
          "I tend to gravitate toward action and thriller films—there's something about the fast pace and the unpredictable plot twists that really draws me in.",
          "Comedies are another genre I turn to fairly often, mostly because they're such an easy way to unwind after a stressful day.",
          "Most of the time, I stream movies at home since it's so convenient, and I can watch whatever I want whenever I feel like it.",
          "That said, there's nothing quite like watching a big blockbuster on a massive screen at the theater, so I try to make that happen with friends every now and then.",
          "The sound and visuals just hit differently in a theater, which makes the whole experience feel a lot more immersive.",
          "So, depending on my mood, I'll either curl up on the couch or head out for the full theater experience.",
        ],
      },
      routine: {
        question: "How often do you watch movies, and what's your process for choosing one?",
        sentences: [
          "Whenever my schedule allows, I try to squeeze in a movie once or twice a week, usually in the evening once I've wrapped up everything else on my plate.",
          "I'm a bit particular about how I pick what to watch, too—I'll almost always check reviews and ratings online beforehand so I don't waste two hours on something mediocre.",
          "During the week, I usually watch solo since it helps me decompress without much effort.",
          "On weekends, though, I try to save that time for watching with friends, since discussing the plot afterward is honestly half the fun.",
          "Sometimes we'll even debate over what to watch for a good twenty minutes before actually settling on something.",
          "Either way, movies have become this reliable little ritual that helps me reset from a busy week.",
        ],
      },
      experience: {
        question: "Tell me about a memorable movie-watching experience you've had.",
        sentences: [
          "There's one movie-watching experience that's really stuck with me over the years.",
          "I went in without knowing much about the plot, and it turned out to be this incredibly moving story about a family navigating a really difficult situation.",
          "By the end, I was completely in tears, which honestly doesn't happen to me very often with movies.",
          "I happened to be watching it with my sister, and we were both an emotional wreck by the time the credits rolled.",
          "What made it even more memorable, though, was the conversation we had afterward—we ended up talking about the film, and honestly about our own family, for hours.",
          "It's rare for a movie to spark that kind of reflection, which is probably why it's stayed with me for so long.",
          "Even now, whenever that film comes up in conversation, I can't help but think back to that night.",
        ],
      },
    },
  },

  music: {
    label: "음악 감상",
    items: {
      description: {
        question: "What kind of music do you enjoy, and how do you usually listen to it?",
        sentences: [
          "Music plays a pretty significant role in my everyday life, to be honest.",
          "My taste leans toward pop and R&B—there's something about the melodies and the lyrics that just resonates with me on a personal level.",
          "I almost always have my earphones in, whether I'm commuting, studying, or just walking around the neighborhood.",
          "Music has this way of setting the tone for whatever I'm doing, so I tend to switch up what I listen to depending on my mood.",
          "When I need to focus, I'll usually put on something instrumental, whereas upbeat pop tends to be my go-to when I'm just relaxing.",
          "All in all, it's hard for me to imagine getting through a day without some kind of soundtrack running in the background.",
        ],
      },
      routine: {
        question: "How often do you listen to music, and how do you usually discover new songs?",
        sentences: [
          "Music has basically become part of my daily routine at this point—I've got it playing in the background whether I'm working, commuting, or doing chores around the house.",
          "I'm pretty particular about curating playlists, too; I'll organize songs by mood or genre so I always have something that fits the moment.",
          "To keep my playlist fresh, I make a habit of checking the charts weekly and occasionally digging through recommendations to find hidden gems.",
          "I also follow a handful of artists closely, so I usually know right away when they release something new.",
          "Every so often, a friend will send me a song out of nowhere, and that ends up being how I discover some of my favorite tracks.",
          "So between the charts, recommendations, and friends' suggestions, my playlist is constantly evolving.",
        ],
      },
      experience: {
        question: "Tell me about a memorable experience related to music, such as attending a concert.",
        sentences: [
          "A music-related memory that I'll probably never forget is a concert I went to with a few close friends a while back.",
          "My favorite artist was headlining that night, and the energy in the venue was honestly incredible.",
          "Everyone around us was singing along at the top of their lungs, and the whole crowd just fed off each other's excitement.",
          "We ended up dancing and belting out every single song for the entire set, completely losing track of time.",
          "At one point, the artist brought out a surprise guest, and the crowd went absolutely wild—it's one of those moments you just can't plan for.",
          "By the time we left, my voice was practically gone from all the singing, but I couldn't stop smiling the whole way home.",
          "Looking back on it now, I'd say it's easily one of the most memorable nights I've had in recent years.",
        ],
      },
    },
  },

  park: {
    label: "공원 가기",
    items: {
      description: {
        question: "Tell me about a park you like to visit. What does it look like?",
        sentences: [
          "Not far from my place, there's a park that's become one of my favorite spots to unwind.",
          "It's got a good mix of greenery, a walking trail that loops around a small pond, and plenty of benches where people just sit and take in the scenery.",
          "There's also a small area with exercise equipment that a lot of the older residents in the neighborhood use in the mornings.",
          "Whenever things get a bit overwhelming, that's usually where I head to clear my head and get some much-needed fresh air.",
          "It's especially beautiful in the evening, when the sunlight filters through the trees and the whole place gets this warm, golden glow.",
          "Honestly, having a spot like that so close to home makes a bigger difference to my day than I probably realize.",
        ],
      },
      routine: {
        question: "How often do you go to the park, and what do you usually do there?",
        sentences: [
          "I've gotten into the habit of visiting the park a couple of times a week, usually in the evening once things have cooled down a bit.",
          "My go-to routine is just taking a leisurely walk around the trail, often with my dog in tow since he practically drags me there himself.",
          "On top of that, I'll occasionally turn it into a social outing by meeting friends there instead of going solo.",
          "When the weather's nice, we'll sometimes bring a blanket and just sit by the pond chatting for an hour or two.",
          "It's become less about exercise, honestly, and more about carving out a bit of downtime in my week.",
          "Either way, it's turned into one of the more consistent habits I've managed to stick with.",
        ],
      },
      experience: {
        question: "Tell me about a memorable experience you had at a park.",
        sentences: [
          "A particularly memorable trip to the park was during a local festival that happened to be going on.",
          "The whole place was buzzing with people, and rows of food trucks lined the pathways, so naturally I ended up sampling way more street food than I probably should have.",
          "There was also a small outdoor concert happening near the pond, so I grabbed a spot on the grass and settled in.",
          "I ended up staying far longer than I'd originally planned, just soaking in the atmosphere and chatting with strangers who'd claimed the spots around me.",
          "At some point, a group of kids started an impromptu game nearby, and the whole scene just felt wonderfully alive.",
          "It turned into one of those spontaneously great days that I still think back on from time to time.",
          "I really wasn't expecting much when I first headed over, which honestly made the whole day feel even better.",
        ],
      },
    },
  },

  travel_domestic: {
    label: "국내 여행",
    items: {
      description: {
        question: "Tell me about a place in your country that you enjoy traveling to.",
        sentences: [
          "Domestic travel is something I've grown to really appreciate, especially since there are so many hidden gems I hadn't explored before.",
          "If I had to pick a favorite, I'd say Busan tops the list—the beaches are gorgeous, and the seafood alone is worth the trip.",
          "What I love most is how different each region feels, even within the same country, from the food to the local dialect.",
          "I typically plan these getaways around holidays or long weekends, usually with family or a small group of close friends.",
          "Traveling together always makes the experience that much better, since we end up splitting the planning and discovering things we might've missed on our own.",
          "Honestly, I think domestic travel gets overlooked sometimes, but it's given me some of my favorite memories.",
        ],
      },
      routine: {
        question: "How often do you travel domestically, and how do you usually prepare for a trip?",
        sentences: [
          "On average, I manage to squeeze in two or three domestic trips a year, usually timed around long holidays when I actually have enough days off to make it worthwhile.",
          "I'm a bit of a planner, so I always spend time beforehand researching restaurants, hidden local spots, and things to do.",
          "That way, I can make the most of the limited time without wasting a single day figuring things out on the fly.",
          "Depending on who I'm traveling with, I'll either drive if it's a family trip or take the train, which I honestly prefer since it gives me time to just relax and enjoy the scenery.",
          "I also like to leave a bit of the itinerary open, just in case we stumble across something unexpected worth checking out.",
          "That balance of planning and spontaneity is really what makes these trips work for me.",
        ],
      },
      experience: {
        question: "Tell me about a memorable domestic trip you've taken.",
        sentences: [
          "One trip that really stands out was a getaway to Jeju Island I took with a couple of close friends last year.",
          "We rented a car and basically spent the days driving along the coastline, stopping wherever something caught our eye—waterfalls, cafes, quiet beaches, you name it.",
          "The weather ended up being perfect for the entire trip, which meant we came back with what felt like a thousand photos.",
          "One evening, we stumbled across this tiny local restaurant that turned out to serve the best seafood I've ever had, completely by accident.",
          "We ended up staying there talking for hours, long after we'd finished eating, just enjoying each other's company.",
          "Looking back, it's honestly one of the most refreshing and memorable trips I've taken in a long time.",
          "It reminded me that some of the best travel moments happen when you least expect them.",
        ],
      },
    },
  },

  jogging: {
    label: "조깅 / 걷기",
    items: {
      description: {
        question: "Tell me about your exercise routine, such as jogging or walking.",
        sentences: [
          "Jogging has become a pretty essential part of my routine over the past couple of years.",
          "I usually head to the park near my house, typically early in the morning before the crowds show up, since I like having the trail mostly to myself.",
          "Beyond just the physical benefits, I've found that jogging does wonders for my mental state too.",
          "It's basically become my go-to way of clearing my head and shaking off whatever stress built up the day before.",
          "There's something about that quiet, early-morning air that makes the whole routine feel almost meditative.",
          "So, at this point, I'd say jogging is as much about my mindset as it is about staying in shape.",
        ],
      },
      routine: {
        question: "How often do you go jogging, and what does your routine look like?",
        sentences: [
          "I've settled into a routine of jogging roughly three times a week, almost always first thing in the morning since that's when I have the most energy.",
          "Each run usually clocks in around thirty minutes, though I'll sometimes push it longer if I'm feeling good.",
          "Music is non-negotiable for me during these runs—I've got a playlist specifically curated to keep my pace up.",
          "It genuinely makes a huge difference in how motivated I feel, especially on days when I'd rather just stay in bed.",
          "I also try to switch up my route every so often, just to keep things from feeling too repetitive.",
          "Between the playlist and the changing scenery, I've managed to keep the habit going far longer than I expected.",
        ],
      },
      experience: {
        question: "Tell me about a memorable experience you had while jogging.",
        sentences: [
          "There's one jogging experience I still laugh about to this day.",
          "I was about halfway through my usual route when the sky just opened up out of nowhere and it started pouring.",
          "Naturally, I hadn't brought an umbrella, so by the time I sprinted home, I was drenched from head to toe.",
          "What could've been an annoying situation turned out to be a pretty funny memory, since my family couldn't stop laughing at the state I showed up in.",
          "Honestly, neither could I, once I caught my breath and saw myself in the mirror.",
          "We ended up turning it into a whole story we still bring up whenever it rains unexpectedly.",
          "It's a good reminder that even the most routine parts of my day can turn into something memorable.",
        ],
      },
    },
  },
};
