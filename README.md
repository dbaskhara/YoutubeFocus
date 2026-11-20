# YoutubeFocus
Social media platforms such as Facebook, Twitter, Instagram, and TikTok are designed to be addictive and engaging. They are designed to keep users scrolling and clicking through a never-ending stream of content. This constant stream of content can make it difficult to stay focused on other tasks.

When you start browsing social media, you may find yourself clicking from one post to another without realizing how much time has passed. You may start to feel like you can't stop checking your notifications or refreshing your feeds, even when you know you have other things you need to be doing.

Social media can also lead to a phenomenon known as "context switching." This is when you switch back and forth between different tasks, such as checking social media and working on a project. Each time you switch contexts, your brain needs to expend energy to refocus on the new task, which can be mentally exhausting and make it harder to concentrate.

Furthermore, social media can also be a source of stress and anxiety, particularly if you compare your life to others or feel pressure to keep up with the latest trends. This can further distract you from focusing on the tasks at hand.

Overall, social media can be a major distraction that can affect your ability to focus on important tasks. If you find yourself getting distracted by social media, it may be helpful to limit your usage or set specific times when you check your feeds. You can also try using productivity tools or apps that block access to social media during certain times of the day.

## Web app

The `web/` folder is a browser version of the original C++ console app ([main.cpp](main.cpp)). It needs no build step and no server code.

- Click a channel (or press `1`–`9`) to open it in a new tab. Press `/` to filter the list.
- **Manage list** lets you add, edit, reorder and delete channels. Only `http(s)` links are accepted.
- **Focus sessions:** opening a channel starts a countdown (20 minutes by default, or off). The tab title shows the time left, and when it runs out you get a "Time's up" banner and, if you turned them on, a desktop notification. Use **+5 min** or **I'm done**.
- **Videos tab:** YouTube channel links open on the channel's *Videos* tab instead of its home page, which is full of recommendations and Shorts. You can turn this off in Settings.
- **Today's count:** each channel shows how many times you opened it today, so you notice if you keep going back.
- Deleting, resetting and importing can be undone from the message that pops up.
- **Install app** (Chrome/Edge) puts it in its own window, and it keeps working offline.
- Site icons are loaded from each site itself, never from a third-party icon service.
- Your list is saved in the browser's localStorage. **Export list** downloads it as `channelData.txt`, and **Import list** reads that file (the same `Name,URL` format the console app uses) or a JSON export.

Run it locally:

```
python -m http.server 8765 --directory web
```

Then open http://localhost:8765. Because the app is static, it can also be hosted as-is on GitHub Pages or Netlify.
