Its time to add mutliplaer functionality to the game. To do this, I propose these ideas:

1. Player accounts

-   Contains vital information: Username, Email, Password, Money, Inventory, Garage, Level, XP, etc.
-   The user must be logged in to access mutliplayer features
    -   If they user is not logged in, they will only have access to the single player misssion, garage, and inventory.
    -   When the player logs in, their online items will be loaded and their offline items will be unloaded.
    -   IMPORTANT: the player will stay logged in for a week before having to sign in again. During this period, when the user opens the game, they will be prompted to log into online.
        -   If the user does not log in, they will remain in the offline game state
        -   If the user logs in, their online items will be loaded and their offline items will be unloaded.
-   The user will be able to create an account, login, and logout.
    -   If the user forgets their password, they will be given reset codes assigned to their account which can be used to reset their password.
    -   When the user logs out, they will lose access to the multiplayer features, and their online items will be unloaded. If the user has offline game data, it will be loaded.
-   A players online and offline account will never be able to interact with eachother.

2. Mutliplayer features

-   Friends List
    -   The friends list is where players add eachother as friends and invite eachother to races or challenge eachother
    -   This feature will be available by clicking the friends list icon in the top bar. This icon will be displayed to the right of the money text.
        -   Clicking the icon will open a pop-out sidepanel from the right.
        -   The sidepanel will display the list of friends the player has added
            -   If the user clicks on a friend listed, they will be prompted with 3 options
                -   Invite to party
                -   Challenge
                -   Remove friend
            -   For each of these events, the recieving player will be notified of the request with a floating window in the bottom right of the screen
                -   The floating window will display the sender's username and the request type.
                -   The floating window will have a "Accept" and "Decline" button.
                -   If the user accepts, the request will be accepted and the event will be carried out
                -   If the user declines, the request will be declined and the request will be removed from the list.
                -   If there are more than one request, the floating window will display a list of requests where only 5 can be displayed at a time until the player must scroll
                    -   The list will go: {Level} {Username} \n {Request Type} \n {Accept Button} {Decline Button}
        -   If there are no friends, the list will display "No friends added"
        -   At the bottom of the sidepanel, there will be two buttons
            -   Add friend
            -   View Friend Code
        -   If the user clicks on the add friend button, a window will apear asking for the friend code. This is where the user enteres the friend code of another player
        -   If the user clicks on the view friend code button, a window will apear showing the user's friend code. This code will apear as a button where the user can copy to clipboard.
-   Online racing: Players will be able to race eachother with up to 8 players in a signle race.
    -   Players will invite their friends to "parties" ingame
        -   Parties are a new feature where anyone who is in a party will be taken into a race whenver the host of the party starts a race.
    -   Custom races will be available for the host when in a party. This feature can be accessed from the host menu.
        -   The host menu will be a floating window centered vertically on the right side of the screen.
        -   If the user is not in a party, this floating window will not be displayed
        -   If the player is in an empty party (just themself) or in a party with others, the host menu will be displayed
            -   The host menu will act like a computer app with a title bar and minimize button.
                -   Minimize button will just collpase the host menu content so only the bar is left.
            -   Other players will be displayed in list form below the title bar.
                -   The list will go: {Level} {Username} {Ready Status Icon} {Remove From Party Button}
                -   The level will be displayed just as the level display on the top bar
            -   At the bottom of the host menu, there will be a "Start Race" button
                -   This button will be disabled until every party member is ready
                -   After each player is ready, the button will be enabled and the race will begin after a 5 second countdown.
                    -   For every player, this countdown will be displayed over the entire page with the same animation used for leveling up (number slides up from the bottom, replacing old number, and old number slides up offscreen)
                -   After the countdown, the race will begin.
                    -   The players are taken to the race screen where the track has a spot for each player.
                        -   If there are 8 players, there will be 8 spots on the track
                    -   The race will begin after a 3 second countdown, just like the single player race.
                    -   Everything will act the same as a single player race, except the player will be in a race with other players.
                    -   When a player crosses the finish line, they will see their placement and the placement scoreboard and part condition menu underneath
                        -   The placement scoreboard will be displayed as the primary tab of a 2-tab window where the second tab is the part conditions.
                        -   The player can click the next button at the bottom of this menu to go to the part conditions
                        -   If the player is on the part condition tab, the next button will dispear and a back button will apear in the bottom left instead.
                        -   The placement scoreboard will display the placement of each player along with their time to finish.
                            -   If a player has not yet finished the race, the time will be shown as "--.--"
                            -   If a player has not yet finished the race, the placement will be shown as "-"
                        -   By default, eery player will be listed in the scoreboard in a "grayed-out" style to symbolize that they did not yet complete the race and their color will come back as they are moved to the correct placement after comleting the race.
                    -   After all players have finished the race, they can view the placement for as long as they want, or until they are ready for a new race, where thehy will be taken there.
                -   The player can exit the placement/part condition screen by clicking the continue button, just liek the single player race.
            -   Along with the start race button, the host menu will have a "Leave Party" button.
                -   This button will simply make the player leave the party.
                -   The player will remain in any page they were on when they left the party.
            -   A non-host player will instead see a "Ready" button and a "Leave Party" button.
            -   The host will only have a "Start Race" and "Leave Party" button as the host is considered always ready.
        -   The host menu will allow the host to remove players from the party. This is dont by simply clicking the remove button next to the player in the list.
        -   If the host leaves the party, the player added to the party first will become the host. If the new host leaves then the person added after the new host will become host. And so on..
    -   Besides making a party, a player can select a player to "Challenge"
        -   The challenger will select a player from the "Friends List"
        -   The challenger will click on the player, and click challenge
        -   Then an optional "Bet" amount can be selected where the user can bet there own money on the race.
        -   When the challenged player accepts, the race will begin
            -   The post race screen will be the same as a mutliplayer hosted race post screen with the placements and condition tab, with the excpetion that there is a "Collect Bet" button next to the continue button
                -   The "Collect Bet" button will only be visible to the player who won the race.
                -   The "Collect Bet" button will collect the bet from the other player and add it to the winner's money.
                -   The "Collect Bet" button will also remove the bet from the loser's money.
                -   The player can also choose to not take the bet which results in no money being taken from the loser.
        -   A challenge match will not create any party as it is a one time event

In order to implement this, we need to use the prisma client package. To import the package properly, you will have to import it using the generated client directory. I already generated the initalized prismsa client so all you have to do is create the api routes.

You will also have to update the prisma schema.

If you check the prisma.ts file, you will find everything you will need to create and use the api routes.

Steps:

1. Create a task list to outline the steps you will need to take to implement everything
2. Create API routes for all the features outlined in the task list
3. Start working on implementing features in the task list. Go one at a time and after each implemntation, check to see if there are any errors and fix them. After that, have me check to see if the implementation is correct. If so, move on to the next feature. If not, fix the issue and have me check again. Repeat this process until all features are implemented.
