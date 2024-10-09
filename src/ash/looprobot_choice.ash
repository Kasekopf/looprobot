void main(int choice, string page)
{
	string[int] options = available_choice_options();
	int[string] priority;
	int top,pick;

  // Candy cane sword cane adventures
  if (choice == 923 && options contains 5)  // All Over the Map (The Black Forest)
    run_choice(5);
  else if (choice == 780 && options contains 4)  // Action Elevator
    run_choice(4);
  else if (choice == 785 && options contains 4)  // Air Apparent
    run_choice(4);
  else if (choice == 788 && options contains 2)  // Life is Like a Cherry of Bowls
    run_choice(2);
  else if (choice == 691 && options contains 4)  // Second Chest
    run_choice(4);
  else if (choice == 1322) {
    // If NEP quest is food or booze
    if (get_property("_questPartyFairQuest") == "food" || get_property("_questPartyFairQuest") == "booze")
      run_choice(1); // Accept
    else
      run_choice(2); // Decline
  } else if (choice == 182) { // Random lack of an encounter
    int selected_choice = -1;
    foreach num, choice_text in options {
        if (choice_text == "Gallivant down to the head") { // If we can gallivant down to the head, do that
            selected_choice = num;
            break;
        }
    }

    if (selected_choice == -1) {
        foreach num, choice_text in options {
            if (choice_text contains "Flap") { // If we can flap and can't gallivant, try to flap
                selected_choice = num;
                break;
            }
        }
    }

    if (selected_choice == -1) {
        foreach num, choice_text in options {
            if (choice_text == "Pry open a hatch with your candy cane sword") {
                selected_choice = num;
                break;
            } else if (choice_text == "Investigate the crew quarters") {
                selected_choice = num;
                break;
            } else if (choice_text == "You will drop your things and walk away.") {
                selected_choice = num;
                break;
            }
        }
    }

    run_choice(selected_choice);
}
  
  //Everfull dart and airship handling
  else switch (choice) {
		default:
			break;

	case 1525: // Everfull dart
			priority = {
				"Throw a second dart quickly":60,
				"Deal 25-50% more damage":800,
				"You are less impressed by bullseyes":10,
				"25% Better bullseye targeting":20,
				"Butt awareness":30,
				"Add Hot Damage":1000,
				"Add Cold Damage":31,
				"Add Sleaze Damage":1000,
				"Add Spooky Damage":1000,
				"Add Stench Damage":1000,
				"Expand your dart capacity by 1":50,
				"Bullseyes do not impress you much":9,
				"25% More Accurate bullseye targeting":19,
				"Deal 25-50% extra damage":10000,
				"Increase Dart Deleveling from deleveling targets":100,
				"Extra stats from stats targets":39,
				"25% better chance to hit bullseyes":18,
				};
			top = 999999999;
			pick = 1;

			foreach i,x in available_choice_options() {
				if (priority[x] == 0) {
					print(`dart perk "{x}" not in priority list`,"red");
					continue;
				}
				if (priority[x] < top) {
					top = priority[x];
					pick = i;
				}
			}
			run_choice(pick);
			break;
	}
}
