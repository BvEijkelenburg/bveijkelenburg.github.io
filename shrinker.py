import json

with open('steam.json', 'w') as new_data:
    counter = 0
    with open('games.json', encoding="utf-8") as json_file:
        dataset = json.load(fp=json_file)
        new_data.write('[\n')
        for appid, game in dataset.items():
            if counter > 0:
                new_data.write(',\n')

            counter += 1
            if counter % 100 == 0:
                print(counter)

            if isinstance(game['tags'], list):
                game['tags'] = {}

            new_game = {
                "appid": appid,
                "name": game["name"],
                "release_date": game["release_date"],
                "english": int('english' in [x.lower() for x in game["supported_languages"]]),
                "developer": ",".join(game["developers"]),
                "publisher": ",".join(game["publishers"]),
                "platforms": ";".join([x for x in ['windows', 'mac', 'linux'] if game[x]]),
                "required_age": game["required_age"],
                "categories": ";".join(game["categories"]),
                "genres": ";".join(game["genres"]),
                "steamspy_tags": ";".join(list(game["tags"].keys())[0:3]),
                "achievements": game["achievements"],
                "positive_ratings": game["positive"],
                "negative_ratings": game["negative"],
                "average_playtime": game["average_playtime_forever"],
                "median_playtime": game["median_playtime_forever"],
                "owners": game["estimated_owners"],
                "price": game["price"]
            }

            game_str = f"    {json.dumps(new_game, indent=8)[:-1]}    " + '}'
            new_data.write(game_str)

            # if counter == 2:
            #     break

        new_data.write('\n]')
