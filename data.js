// 오픽(OPIc) 답변 생성기 - 템플릿 데이터
// 레벨: IM(중급), IH(고급), AL(최고급)

export const LEVELS = [
  { id: "IM", label: "중급 (IM)" },
  { id: "IH", label: "고급 (IH)" },
  { id: "AL", label: "최고급 (AL)" },
];

export const QTYPE_LABELS = {
  intro: "자기소개",
  description: "묘사",
  routine: "습관 / 일상",
  experience: "경험",
};

export const DEFAULTS = {
  name: "Alex",
  job: "a graduate student",
  city: "Seoul",
};

// 레벨별로 답변 앞/뒤/중간에 붙는 표현 뱅크 (조합에 사용)
export const FILLERS = {
  IM: {
    openers: ["Um, well,", "So,", "Okay, let me talk about this.", "Actually,"],
    transitions: ["Also,", "And also,", "Plus,"],
    closers: [
      "That's pretty much it.",
      "Yeah, that's about all I can say.",
      "So that's my answer.",
    ],
  },
  IH: {
    openers: [
      "Well, let me think about that for a moment.",
      "Sure, I'd be happy to talk about this.",
      "That's an interesting question.",
    ],
    transitions: ["In addition,", "On top of that,", "Moreover,"],
    closers: [
      "Overall, that pretty much sums it up.",
      "So, that's basically the story.",
      "All things considered, that's my experience.",
    ],
  },
  AL: {
    openers: [
      "That's actually a topic I really enjoy talking about.",
      "Let me walk you through this in a bit of detail.",
      "I have quite a bit to say about this, so let me organize my thoughts.",
    ],
    transitions: ["Furthermore,", "What's more,", "Building on that,"],
    closers: [
      "All in all, I'd say that captures the essence of it.",
      "So, to wrap things up, that's really the full picture.",
      "Taking everything into account, that's pretty much how I'd describe it.",
    ],
  },
};

// 주제 목록. self_intro는 intro 하나만, 나머지는 description/routine/experience 세 유형
export const TOPICS = {
  self_intro: {
    label: "자기소개",
    single: true,
    templates: {
      intro: {
        IM: "Hi, my name is {name}. I am {job}, and I live in {city} with my family. In my free time, I like to relax at home or meet up with my friends. I would say I am a friendly and outgoing person, so I get along well with the people around me. That's a little bit about myself.",
        IH: "Hello, my name is {name}. Currently, I'm {job}, and I've been living in {city} for quite a while now. When I'm not busy, I usually spend time hanging out with close friends, watching movies, or just relaxing at home to recharge. I'd describe myself as an open-minded and sociable person who enjoys meeting new people and trying new things. So, that's a quick introduction to who I am.",
        AL: "Hi there, it's a pleasure to introduce myself. My name is {name}, and I'm currently {job}, based in {city}. Outside of my daily responsibilities, I try to make the most of my free time by catching up with close friends, exploring new places around the city, or simply unwinding with a good book or a movie. If I had to describe my personality in a few words, I'd say I'm curious, adaptable, and genuinely enjoy connecting with people from different backgrounds. That's a brief glimpse into who I am.",
      },
    },
  },

  house: {
    label: "집 / 거주지",
    templates: {
      description: {
        IM: "I live in an apartment in {city} with my family. It has two bedrooms, a living room, and a small kitchen. My favorite room is my bedroom because it's quiet and comfortable. I really like living there because it's close to the subway station and there are many stores nearby.",
        IH: "I currently live in an apartment located in {city}, and I've been there for a few years now. It's a mid-sized place with two bedrooms, a cozy living room, and a kitchen that gets a lot of natural light in the morning. My favorite spot in the house is definitely the living room because that's where I relax and watch TV after a long day. What I like most about my place is the location—it's within walking distance of a subway station, so getting around the city is super convenient.",
        AL: "I live in a fairly spacious apartment in {city}, which I moved into a few years ago after searching for quite a while. The place has two bedrooms, a bright living room, and a kitchen that I've gradually decorated to my taste. If I had to pick a favorite spot, I'd say it's the living room, since it's where I unwind with a cup of tea after work. What really sold me on this place, though, is the location—it's just a short walk from the subway, and there's a small park nearby where I can clear my head whenever I need a break.",
      },
      routine: {
        IM: "On a normal day, I usually clean my room and do the laundry. I also cook simple meals for myself and watch TV or use my phone before I go to bed. On weekends, I clean the whole house more thoroughly.",
        IH: "On a typical day, I usually tidy up my room a bit and take care of small chores like doing the dishes or the laundry. In the evenings, I tend to cook a simple meal, and afterward, I like to unwind by watching a show or scrolling through my phone until it's time for bed. On weekends, though, I set aside more time to do a deep cleaning of the whole house.",
        AL: "On a regular day, I typically start by straightening up my room and handling little chores such as the dishes or laundry before I head out. In the evening, I usually whip up something simple for dinner, and once that's done, I like to wind down by watching a show or catching up on messages before turning in for the night. Weekends are a different story, though—that's when I really roll up my sleeves and give the whole house a proper deep clean, from vacuuming to organizing the closets.",
      },
      experience: {
        IM: "One memorable experience was when I moved to my current place. It was hard work because I had a lot of boxes to carry. My friends helped me, and we ordered pizza after we finished. I was very tired but happy because the new place felt comfortable.",
        IH: "One experience that really stands out to me was the day I moved into my current apartment. It was pretty chaotic because I had so many boxes to unpack, and I ended up spending the entire day organizing everything. Thankfully, a couple of my close friends came over to help, and we ordered pizza once we were finally done. I was completely exhausted by the end of the day, but seeing the place come together made it all worth it.",
        AL: "A moving experience that really sticks with me is the day I moved into my current apartment. Looking back, it was honestly a bit chaotic—I'd underestimated just how many boxes I'd accumulated over the years, and I ended up spending the entire day sorting through everything. Luckily, a few close friends showed up to lend a hand, and we ended up ordering way too much pizza once we finally called it done. I remember being utterly exhausted, but there was something really satisfying about seeing all my stuff finally settled into a space that felt like home.",
      },
    },
  },

  movie: {
    label: "영화 보기",
    templates: {
      description: {
        IM: "I like watching movies in my free time. My favorite genre is action movies because they are exciting. I usually watch movies at home using a streaming service, but sometimes I go to the movie theater with my friends.",
        IH: "One of my favorite hobbies is watching movies. I'm especially drawn to action and thriller movies because they keep me on the edge of my seat. Most of the time, I watch movies at home through a streaming service, but every once in a while, I like to head to the theater with friends for the full experience, popcorn and all.",
        AL: "Watching movies is honestly one of my go-to hobbies whenever I have some downtime. I tend to gravitate toward action and thriller films—there's something about the fast pace and unpredictable plot twists that really draws me in. While I mostly stream movies at home these days since it's so convenient, there's nothing quite like watching a big blockbuster on the huge screen at the theater with friends, so I try to make that happen every now and then.",
      },
      routine: {
        IM: "I usually watch movies once or twice a week. I check reviews online before I choose a movie. I often watch alone during the week and watch with friends on weekends.",
        IH: "I try to watch a movie once or twice a week, usually in the evening after I've finished my other tasks. Before choosing what to watch, I like to check reviews online so I don't waste my time on something disappointing. During the week, I mostly watch alone to relax, but on weekends, I prefer watching with friends since it's more fun to talk about the movie afterward.",
        AL: "Whenever my schedule allows, I try to squeeze in a movie once or twice a week, usually in the evening once I've wrapped up everything else on my plate. I'm a bit particular about how I pick what to watch, too—I'll almost always check reviews and ratings online beforehand so I don't end up wasting two hours on something mediocre. During the week, I usually watch solo since it helps me unwind, but I try to save the weekends for watching with friends, since discussing the plot afterward is honestly half the fun.",
      },
      experience: {
        IM: "I remember watching a movie that made me cry. It was a sad story about a family. I watched it with my sister, and we both cried a lot. After the movie, we talked about it for a long time.",
        IH: "I remember one time I watched a movie that left a huge emotional impact on me. It was a touching story about a family going through a difficult time, and I ended up crying more than I expected. I watched it with my sister, and we were both a mess by the end. Afterward, we sat and talked about the movie for what felt like hours.",
        AL: "There's one movie-watching experience that's really stuck with me over the years. I went in without knowing much about the plot, and it turned out to be this incredibly moving story about a family navigating a really tough situation—by the end, I was completely in tears, which doesn't happen to me often with movies. I happened to be watching it with my sister, and we were both an emotional wreck by the credits. What made it even more memorable, though, was the conversation we had afterward—we ended up talking about the film, and honestly about our own family, for hours.",
      },
    },
  },

  music: {
    label: "음악 감상",
    templates: {
      description: {
        IM: "I really enjoy listening to music. My favorite genre is pop music because the songs are catchy. I usually listen to music using my phone, especially when I am on the bus or studying.",
        IH: "Listening to music is something I genuinely enjoy doing throughout the day. I'm mostly into pop and R&B because the melodies are catchy and easy to get into. I usually listen through my phone with earphones, especially while I'm commuting or studying, since it helps me focus and pass the time.",
        AL: "Music plays a pretty big role in my everyday life, to be honest. My taste leans toward pop and R&B—there's something about the melodies and the lyrics that just resonates with me. I almost always have my earphones in, whether I'm commuting, studying, or just walking around, since music has this way of setting the tone for whatever I'm doing.",
      },
      routine: {
        IM: "I listen to music almost every day. I usually make playlists with my favorite songs. I listen to new songs by checking the music charts every week.",
        IH: "I make it a point to listen to music almost every single day, whether it's in the background while I work or during my commute. I like to organize my favorite songs into playlists based on my mood. To stay updated, I usually check the music charts every week to discover new songs that are trending.",
        AL: "Music has basically become part of my daily routine at this point—I've got it playing in the background whether I'm working, commuting, or just doing chores around the house. I'm pretty particular about curating playlists, too; I'll organize songs by mood or genre so I always have something that fits the moment. To keep my playlist fresh, I make a habit of checking the charts weekly and occasionally digging through recommendations to find hidden gems.",
      },
      experience: {
        IM: "I remember going to a concert with my friends. The singer was my favorite artist, and the concert was amazing. We sang and danced together. It was one of the best days of my life.",
        IH: "One experience that really stands out was the time I went to a concert with my friends. My favorite artist was performing, and the atmosphere was absolutely electric. We sang along to every song and danced the entire time. Looking back, it was honestly one of the best nights I've had.",
        AL: "A music-related memory that I'll probably never forget is the concert I went to with a few close friends a while back. My favorite artist was headlining, and the energy in the venue was just incredible—everyone around us was singing along at the top of their lungs. We ended up dancing and belting out every song for the entire set, completely losing track of time. Looking back on it now, I'd say it's easily one of the most memorable nights I've had.",
      },
    },
  },

  park: {
    label: "공원 가기",
    templates: {
      description: {
        IM: "There is a park near my house that I like to visit. It has a lot of trees and a walking path. I usually go there to relax and get some fresh air.",
        IH: "There's a park close to my house that I really enjoy visiting whenever I get the chance. It's got plenty of trees, a nice walking path, and even a small pond in the middle. I usually head over there to relax, clear my head, and get some fresh air away from my screen.",
        AL: "Not far from my place, there's a park that's become one of my favorite spots to unwind. It's got a good mix of greenery, a walking trail that loops around a small pond, and plenty of benches where people just sit and enjoy the scenery. Whenever things get a bit overwhelming, that's usually where I head to clear my head and get some much-needed fresh air.",
      },
      routine: {
        IM: "I go to the park about twice a week, usually in the evening. I like to walk around the park, and sometimes I bring my dog with me. Sometimes I meet my friends there too.",
        IH: "I try to visit the park about twice a week, usually in the evening after dinner when it's a bit cooler outside. I like taking a slow walk around the trail, and I often bring my dog along since he loves it there. Every now and then, I'll arrange to meet up with friends at the park instead of going alone.",
        AL: "I've gotten into the habit of visiting the park a couple of times a week, usually in the evening once things have cooled down a bit. My go-to routine is just taking a leisurely walk around the trail, often with my dog in tow since he practically drags me there himself. On top of that, I'll occasionally turn it into a social outing by meeting friends there instead of going solo, which makes the whole thing feel less like exercise and more like hanging out.",
      },
      experience: {
        IM: "One time, I went to the park during a festival. There were a lot of people and food trucks. I ate delicious street food and watched a small concert. It was a fun day.",
        IH: "One memorable experience was visiting the park during a local festival. The place was packed with people, and there were food trucks lined up all around. I ended up trying a bunch of different street food and even caught a small outdoor concert. It turned out to be a really fun and lively day.",
        AL: "A particularly memorable trip to the park was during a local festival that happened to be going on. The whole place was buzzing with people, and rows of food trucks lined the pathways, so naturally I ended up sampling way more street food than I probably should have. There was also a small outdoor concert happening near the pond, so I grabbed a spot on the grass and ended up staying far longer than I'd originally planned. It turned into one of those spontaneously great days that I still think back on.",
      },
    },
  },

  travel_domestic: {
    label: "국내 여행",
    templates: {
      description: {
        IM: "I like traveling around my country. My favorite place to visit is Busan because it has a beautiful beach. I usually travel with my family or friends during vacation.",
        IH: "I really enjoy traveling within my own country whenever I get some time off. My favorite destination is probably Busan, mainly because of its beautiful beaches and great seafood. I usually plan these trips with my family or a few close friends, especially during holidays or long weekends.",
        AL: "Domestic travel is something I've grown to really appreciate, especially since there are so many hidden gems I hadn't explored before. If I had to pick a favorite, I'd say Busan tops the list—the beaches are gorgeous, and the seafood alone is worth the trip. I typically plan these getaways around holidays or long weekends, usually with family or a small group of close friends, since traveling together always makes the experience that much better.",
      },
      routine: {
        IM: "I usually travel domestically two or three times a year. Before I go, I search for good restaurants and places to visit online. I usually travel by car or train.",
        IH: "I typically take two or three domestic trips a year, usually during long holidays when I have enough time off. Before heading out, I always spend some time researching good restaurants and must-see spots online so I don't waste time once I'm there. As for transportation, I usually go by car if I'm traveling with family, or by train if it's just me or a smaller group.",
        AL: "On average, I manage to squeeze in two or three domestic trips a year, usually timed around long holidays when I actually have enough days off to make it worthwhile. I'm a bit of a planner, so I always spend time beforehand researching restaurants, hidden local spots, and things to do so I can make the most of the limited time. Depending on who I'm traveling with, I'll either drive if it's a family trip or take the train, which I honestly prefer since it gives me time to just relax and enjoy the scenery.",
      },
      experience: {
        IM: "Last year, I traveled to Jeju Island with my friends. We rented a car and visited many beautiful places. The weather was perfect, and we took a lot of photos. It was a really enjoyable trip.",
        IH: "Last year, I took a trip to Jeju Island with a couple of close friends, and it turned out to be one of my favorite trips ever. We rented a car and drove around the island, stopping at all sorts of beautiful spots along the coast. The weather cooperated perfectly, so we ended up taking way too many photos. Overall, it was an incredibly enjoyable and relaxing trip.",
        AL: "One trip that really stands out was a getaway to Jeju Island I took with a couple of close friends last year. We rented a car and basically spent the days driving along the coastline, stopping wherever something caught our eye—waterfalls, cafes, quiet beaches, you name it. The weather ended up being perfect for the entire trip, which meant we came back with what felt like a thousand photos. Looking back, it's honestly one of the most refreshing and memorable trips I've taken in a long time.",
      },
    },
  },

  jogging: {
    label: "조깅 / 걷기",
    templates: {
      description: {
        IM: "I like jogging for exercise. I usually jog in the park near my house. I think jogging is a good way to stay healthy and reduce stress.",
        IH: "Jogging is one of my main forms of exercise, and I really enjoy it. I usually go jogging in the park near my house, especially early in the morning when it's quiet. I find that jogging is a great way to stay in shape and also helps clear my mind after a stressful day.",
        AL: "Jogging has become a pretty essential part of my routine over the past couple of years. I usually head to the park near my house, typically early in the morning before the crowds show up, since I like having the trail mostly to myself. Beyond just the physical benefits, I've found that jogging does wonders for my mental state too—it's basically become my go-to way of clearing my head and shaking off stress.",
      },
      routine: {
        IM: "I go jogging three times a week, usually in the morning. I jog for about thirty minutes each time. I always listen to music while I jog.",
        IH: "I try to go jogging about three times a week, usually first thing in the morning before starting my day. Each session lasts around thirty minutes, which feels like the right balance for me. I almost always have music playing through my earphones, since it really helps keep me motivated during the run.",
        AL: "I've settled into a routine of jogging roughly three times a week, almost always first thing in the morning since I find I have the most energy then. Each run usually clocks in around thirty minutes, though I'll sometimes push it longer if I'm feeling good. Music is non-negotiable for me during these runs—I've got a playlist specifically curated to keep my pace up, and it genuinely makes a huge difference in how motivated I feel.",
      },
      experience: {
        IM: "One time, it started raining while I was jogging. I didn't have an umbrella, so I got very wet. I ran home quickly and laughed about it with my family.",
        IH: "One time I remember pretty vividly is when it suddenly started pouring rain while I was in the middle of a jog. I didn't have an umbrella or anything, so I ended up completely soaked by the time I got home. Instead of being upset about it, I actually ended up laughing about the whole situation with my family once I got back.",
        AL: "There's one jogging experience I still laugh about—I was about halfway through my usual route when the sky just opened up out of nowhere and it started pouring. Naturally, I hadn't brought an umbrella, so by the time I sprinted home, I was drenched from head to toe. What could've been an annoying situation turned out to be a pretty funny memory, since my family couldn't stop laughing at the state I showed up in, and honestly, neither could I.",
      },
    },
  },
};
