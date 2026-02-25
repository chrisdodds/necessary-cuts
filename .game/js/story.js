const scenes = [
  // ========== SCENE 0: THE LAKE AT NIGHT ==========
  {
    label: 'the lake',
    ambient: 'lake',
    beats: [
      {
        passages: [
          { text: "On your last night, the water splashes against the shore, louder than usual.", class: "" },
          { text: "Like someone clicking their tongue, trying to tell you something.", class: "feeling" },
        ],
        delay: 800
      },
      {
        passages: [
          { text: "The crickets and frogs go quiet.", class: "whisper" },
          { text: "You sneak outside and sit at the edge of the hill. The moon cuts a white path across the water.", class: "" },
        ],
        delay: 600
      },
      {
        passages: [
          { text: "The clicking gets faster, urgent. The metal pens groan and shift.", class: "" },
          { text: "You don't understand what the lake is saying. But it seems to want an answer.", class: "feeling" },
        ],
        choices: [
          { text: "Tell it you'll miss the fish.", next: 'lake_fish' },
          { text: "Tell it you don't want to go.", next: 'lake_stay' },
          { text: "Say nothing. Just listen.", next: 'lake_listen' },
        ]
      }
    ],
    branches: {
      lake_fish: {
        beats: [
          {
            passages: [
              { text: "You tell the lake you'll miss the fish. The water. The trees. The boats.", class: "" },
              { text: "You tell it a thousand different things, but the clicking just keeps ratcheting up.", class: "" },
            ],
            delay: 800
          },
          {
            passages: [
              { text: "You're breathing hard. Angry that all your words are the wrong shape.", class: "feeling" },
            ],
            choices: [
              { text: "I love you.", next: 'lake_resolve' },
              { text: "Keep trying to find the right words.", next: 'lake_struggle' },
            ]
          }
        ]
      },
      lake_stay: {
        beats: [
          {
            passages: [
              { text: "You tell it you don't want to leave. That this is home. That you don't understand why you have to go.", class: "" },
              { text: "The clicking pauses. Then comes back harder.", class: "" },
            ],
            delay: 800
          },
          {
            passages: [
              { text: "It doesn't care what you want. It wants something specific. Something you haven't said yet.", class: "feeling" },
            ],
            choices: [
              { text: "I love you.", next: 'lake_resolve' },
              { text: "Just sit with the silence.", next: 'lake_struggle' },
            ]
          }
        ]
      },
      lake_listen: {
        beats: [
          {
            passages: [
              { text: "You try to just listen. To hear what it's really saying.", class: "" },
              { text: "The clicking slows. Pauses. Starts again, patient now. Like it's waiting for you to catch up.", class: "" },
            ],
            delay: 800
          },
          {
            passages: [
              { text: "You open your mouth. Close it. Everything you think to say feels too small.", class: "feeling" },
            ],
            choices: [
              { text: "I love you.", next: 'lake_resolve' },
              { text: "I'm sorry.", next: 'lake_struggle' },
            ]
          }
        ]
      },
      lake_struggle: {
        beats: [
          {
            passages: [
              { text: "The clicking keeps going. Relentless. Your chest tightens and your face gets hot.", class: "" },
              { text: "You don't have the right words. Maybe there aren't any.", class: "feeling" },
            ],
            delay: 1200
          },
          {
            passages: [
              { text: "Finally, without thinking—", class: "whisper" },
            ],
            choices: [
              { text: "I love you.", next: 'lake_resolve' },
            ]
          }
        ]
      },
      lake_resolve: {
        beats: [
          {
            passages: [
              { text: '"I love you."', class: "spoken" },
              { text: "That feels right.", class: "feeling" },
            ],
            delay: 1500
          },
          {
            passages: [
              { text: "The lake sighs like a screen door closing, and the clicking softens.", class: "" },
              { text: "The crickets and frogs come back louder. You want to put their sound in a jar to take with you.", class: "" },
            ],
            delay: 2000,
            then: 'next_scene'
          }
        ]
      }
    }
  },

  // ========== SCENE 1: THE BEDROOM ==========
  {
    label: 'the bedroom',
    ambient: 'bedroom',
    beats: [
      {
        passages: [
          { text: "When you get back to your room, something's different.", class: "" },
          { text: "The air has changed.", class: "whisper" },
        ],
        delay: 1200
      },
      {
        passages: [
          { text: "In the corner, there's a skeleton raccoon.", class: "" },
          { text: "Not lying there like Dad's other bones. Sitting up. Waiting.", class: "" },
        ],
        delay: 1000
      },
      {
        passages: [
          { text: "The raccoon walks across the floor on its bone feet, making little tick-tick sounds.", class: "" },
        ],
        choices: [
          { text: "Hold still. Let it come to you.", next: 'raccoon_still' },
          { text: "Reach out a hand.", next: 'raccoon_reach' },
          { text: "Pull the covers up.", next: 'raccoon_hide' },
        ]
      }
    ],
    branches: {
      raccoon_still: {
        beats: [
          {
            passages: [
              { text: "You hold still. Don't even breathe.", class: "" },
              { text: "The raccoon tilts its skull. Studies you. Then climbs onto your bed.", class: "" },
            ],
            delay: 600,
            then: 'raccoon_bed'
          }
        ]
      },
      raccoon_reach: {
        beats: [
          {
            passages: [
              { text: "You reach out your hand. The raccoon sniffs your fingers with the place where its nose used to be.", class: "" },
              { text: "Then it climbs onto your bed.", class: "" },
            ],
            delay: 600,
            then: 'raccoon_bed'
          }
        ]
      },
      raccoon_hide: {
        beats: [
          {
            passages: [
              { text: "You pull the covers up to your chin. The raccoon pauses. Tick-tick. Tick.", class: "" },
              { text: "It waits. Patient. Like it has nowhere else to be.", class: "" },
            ],
            delay: 1000
          },
          {
            passages: [
              { text: "After a long time, you lower the blanket. The raccoon climbs onto your bed.", class: "" },
            ],
            delay: 600,
            then: 'raccoon_bed'
          }
        ]
      },
      raccoon_bed: {
        beats: [
          {
            passages: [
              { text: "It curls into a ball against your chest.", class: "" },
              { text: "You wrap your arm around it and feel the spaces between its ribs, each one just the size of your fingers.", class: "" },
            ],
            delay: 800
          },
          {
            passages: [
              { text: "Something hums inside it, like flies buzzing but deeper.", class: "feeling" },
            ],
            choices: [
              { text: "Thank you.", next: 'raccoon_thanks' },
              { text: "Where did you come from?", next: 'raccoon_where' },
              { text: "Say nothing. Just hold it.", next: 'raccoon_hold' },
            ]
          }
        ]
      },
      raccoon_thanks: {
        beats: [
          {
            passages: [
              { text: '"Thank you." You squeeze it tight.', class: "spoken" },
              { text: "The tears come. You don't try to stop them this time.", class: "" },
            ],
            delay: 1200,
            then: 'raccoon_sleep'
          }
        ]
      },
      raccoon_where: {
        beats: [
          {
            passages: [
              { text: '"Where did you come from?"', class: "spoken" },
              { text: "The hum deepens. It doesn't answer. Doesn't need to.", class: "" },
              { text: "You squeeze it tight. The tears come. You don't try to stop them this time.", class: "" },
            ],
            delay: 1200,
            then: 'raccoon_sleep'
          }
        ]
      },
      raccoon_hold: {
        beats: [
          {
            passages: [
              { text: "You don't say anything. You just hold it.", class: "" },
              { text: "Squeeze it tight. The tears come. You don't try to stop them this time.", class: "" },
            ],
            delay: 1200,
            then: 'raccoon_sleep'
          }
        ]
      },
      raccoon_sleep: {
        beats: [
          {
            passages: [
              { text: "It's not warm itself, but you feel warmer holding it.", class: "feeling" },
              { text: "You relax your grip a little and feel your breath slowing down.", class: "" },
              { text: "It nestles closer.", class: "whisper" },
            ],
            delay: 3000,
            then: 'next_scene'
          }
        ]
      }
    }
  },

  // ========== SCENE 2: MORNING / DEPARTURE ==========
  {
    label: 'departure',
    ambient: 'morning',
    beats: [
      {
        passages: [
          { text: "The skeleton raccoon is still there in the morning.", class: "" },
          { text: "You wrap it in one of your t-shirts and tuck it into the backpack Mom gave you for overnight stuff.", class: "" },
        ],
        delay: 800
      },
      {
        passages: [
          { text: "It chirps when you zip the bag closed.", class: "" },
          { text: '"It\'ll be OK," you whisper. "I\'ll let you out soon."', class: "spoken" },
        ],
        delay: 1000
      },
      {
        passages: [
          { text: "When you start driving away, a lady with brown skin and a purple crayon dress steps into the road and waves.", class: "" },
          { text: "She gives you a sweet potato pie. It's the best thing you've ever tasted—sugary and creamy—nothing at all like a potato.", class: "" },
          { text: "Everything in you feels warm as you eat it.", class: "feeling" },
        ],
        delay: 800
      },
      {
        passages: [
          { text: "You tell Mom you don't want to leave. You shouldn't move.", class: "" },
        ],
        choices: [
          { text: "This is home.", next: 'depart_home' },
          { text: "What about the fish?", next: 'depart_fish' },
          { text: "Just press closer to her.", next: 'depart_close' },
        ]
      }
    ],
    branches: {
      depart_home: {
        beats: [
          {
            passages: [
              { text: "Mom squeezes you.", class: "" },
              { text: '"I know, baby. I don\'t want to either."', class: "spoken" },
              { text: "Her arm around you is firm, but the rest of her is shaking.", class: "" },
            ],
            delay: 1000,
            then: 'depart_trailer'
          }
        ]
      },
      depart_fish: {
        beats: [
          {
            passages: [
              { text: "Mom's face softens. She doesn't have an answer for the fish.", class: "" },
              { text: "She just squeezes you.", class: "" },
              { text: '"I know, baby. I don\'t want to either."', class: "spoken" },
              { text: "Her arm around you is firm, but the rest of her is shaking.", class: "" },
            ],
            delay: 1000,
            then: 'depart_trailer'
          }
        ]
      },
      depart_close: {
        beats: [
          {
            passages: [
              { text: "She pulls you close without you having to ask.", class: "" },
              { text: '"I know, baby. I don\'t want to either."', class: "spoken" },
              { text: "Her arm around you is firm, but the rest of her is shaking.", class: "" },
            ],
            delay: 1000,
            then: 'depart_trailer'
          }
        ]
      },
      depart_trailer: {
        beats: [
          {
            passages: [
              { text: "Some men come with a semi truck and try to move your trailer, but it breaks apart as they follow you.", class: "" },
              { text: "The frame groans, then folds in on itself—like it didn't want to go either.", class: "" },
            ],
            delay: 1200
          },
          {
            passages: [
              { text: "You sneak the raccoon out of your bag.", class: "" },
              { text: "It climbs into your lap. Its bone fingers grip your shirt when you hit bumps.", class: "" },
            ],
            delay: 1500
          },
          {
            passages: [
              { text: "Behind you, the lake gets smaller and smaller until it's swallowed between the dirt and sky.", class: "" },
            ],
            delay: 3000,
            then: 'ending'
          }
        ]
      }
    }
  }
];
