_This article assumes basic familiarity with GenServers and how to write one_

_See [this article](https://elixirschool.com/en/lessons/advanced/otp-concurrency/#genserver) if you're unsure of how GenServers work_

### Common GenServer Mistakes

Overusing GenServers is a common mistake when getting started with Elixir. The common pattern
I've seen, is wrapping most of the code with potential for failure in
a GenServer, because if it does fail, it is isolated and wont crash the rest of the application.
However, GenServers have the potential of being extremely dangerous to our application
because they can become a bottleneck, which could even result in dropped messages from other processes.

One of GenServer’s most important principles is that it can only process one message at a time.
This means that in order to handle multiple messages happening in parallel, we need to have
multiple instances/processes of that GenServer running.


Elixir's concurrency and parallelism is achieved through processes.

<div style='display: flex; justify-content: center; align-items: center; margin: 20px 0;'>
<img src='https://mikakalathil.ca/assets/svg/gen-server-type-diff.svg' height='300px'>
</div>

### What are the costs of GenServers?
Let's say we're creating a mailer (using [swoosh](https://github.com/swoosh/swoosh))
and you wrap our code in a GenServer (because if it fails, we don't want it to crash
the application). In this example we will see actual code I've seen in a production app.

```elixir
defmodule MyApp.Mailer do
  use Swoosh.Mailer, otp_app: :sample
end

defmodule MyApp.MailSender do
  use GenServer

  import Swoosh.Email

  @from_info {"Bill Nye", "BillNye@TheScienceGuy.org"}

  # Client

  def start_link(_), do: :ok

  def send_mail(email, name, subject, body) do
    GenServer.call(:mailer, {:send_email, {email, name, subject, body}})
  end

  def send_mail_async(email, name, subject, body) do
    GenServer.cast(:mailer, {:send_email, {email, name, subject, body}})
  end

  # Server (callbacks)

  @impl GenServer
  def init(_), do: :ok

  @impl GenServer
  def handle_cast({:send_mail, {email, name, subect, body}}, _, _) do
    email
      |> create_mail(name, subject, body)
      |> Mailer.deliver
  end

  @impl GenServer
  def handle_call({:send_mail, {email, name, subect, body}}, _, _) do
    email
      |> create_mail(name, subject, body)
      |> Mailer.deliver
  end

  defp create_mail(email, name, subject, body) do
    new()
      |> to({name, email})
      |> from(@from_info)
      |> subject(subject)
      |> html_body(body)
  end
end
```

Here we've created a GenServer with two functions that send mail. The `send_mail` function using `call`, which
returns the results of the send request, while the `send_mail_async` function using `cast`, will return right
away and execute the request shortly after. This module allows mail sends to fail, so that the rest of
our system does not crash!

### The Unintended Side Effects

By wrapping our code in a GenServer, a potential unintended side-effect
is that we are limited to only being able to process one message at a time. This can be
leveraged as a back-pressure system, but there are much better solutions out
there, like [GenStage](https://hexdocs.pm/gen_stage/GenStage.html)! One of the reason is
timeouts. When calls start queing up and taking longer than the timeout, GenServer will drop
some messages and the information will be lost! If passing one message at a time is an
unintended side effect (for example in the case that we want the system to process multiple
messages and run long running actions in parallel) we've created a bottleneck.

Our calls for the GenServer are run on a singular thread, this means calling GenServer multiple times will result in a
queue of messages, which could potentially halt the calling process until the GenServer has finished processing the prior queue to your message.

##### Example:
Say we've got a job processing system, and it batches up groups of 100 emails and sends them all at once. In another part of our API, we've got a endpoint that send mail instantly and the response of the mail is passed along to the return of the API.

<div style='display: flex; justify-content: center; align-items: center; margin: 20px 0;'>
<img src='https://mikakalathil.ca/assets/svg/gen-server-blocking.svg' height='300px'>
</div>

We're now waiting for `send_mail_async` #1 - 100 to run, before that endpoint returns the result of sending it's one message, at worst case, 100 messages clogs the queue for to long and our API call to send a message times out.

### What can be harmful about this?
First, usually we don't want to be losing messages in the queue (as can happen with timeouts). Second, if we're running many long running functions at once, wouldn't we want them returning as quickly as possible instead of one after the other? This is a sign our application isn't able to scale to demand. Why start with bottlenecks? This is one of the dangers of GenServers, although there are others as well, such as memory.

GenServers have the capability of storing large amounts of state (though this is all in
memory, and memory isn't free). We need to be careful with what we store in the state
because memory is not unlimited or cheap. The other issue with using GenServer for state
is when it comes to distribution, how will the state work? If we have more nodes, does
the state need to be shared? What happens if one of the nodes dies, or is cut off
from the network? These are important questions to ask ourselves when creating
distributed systems. While out of scope for this article, I'll answer these questions
next time on: *Distributed GenServers*.

Another issue around memory and GenServers is message passing, as it isn't cheap. Large
messages need to be passed in a different way, otherwise they will get copied in memory.
Doing multiple copies with large messages can lead to your system taking up more resources
than expected. Discord created [fastglobal](https://github.com/discordapp/fastglobal) as
a solution to this problem.

### Parallelism: Registries to the rescue
If we want to solve some of these issues, particularly around creating bottlenecks or
slowdowns; we have the solution! Registries! These provide us with a way to store a
Key-Value dictionary of name -> PID.This allows us to ask the registry to lookup
the PID and then call the PID directly which can be your GenServer.

Using registries changes the flow to something like this:

<div style='display: flex; justify-content: center; align-items: center; margin: 20px 0;'>
<img src='https://mikakalathil.ca/assets/svg/gen-server-registry.svg' height='300px'>
</div>

Registries provide a great solution to possible bottlenecks with GenServers that come from
many messages hitting it at once. But this solution assumes we're running on one machine
locally, so what happens when we start to go distributed? This requires a registry that
can communicate distributedly, making these libraries some of the solutions:

- [horde](https://github.com/michalmuskala/horde)
- [gproc](https://github.com/uwiger/gproc)
- [pg2](http://erlang.org/doc/man/pg2.html)

### The issue with GenServers as a cache
On several occasions, I have seen GenServers being used as a cache. Most recently in a job interview
I was asked to create a caching module, so I went ahead and used [con_cache](https://github.com/sasa1977/con_cache).
I was told my solution differed from the norm and that most people had chosen to use a GenServer, which might not have been necessary. I see a lot of GenServers that could be implemented as [Agents](https://hexdocs.pm/elixir/Agent.html) instead.
It is better to use the simplest solution, adding complexity if necessary afterwards.

[con_cache](https://github.com/sasa1977/con_cache) runs on top of ETS, which for reads and writes can be async and can be
called in parallel. This means that we can't have a queue build up to access and modify state when
there are tons of requests at once, which is a (low) possibility with the GenServer implementation.
This limitation is something to be aware of and we should monitor and analyze performance
to see if we should use something like ETS instead, which
incidentally is also how Registries work. If you are using ETS, I suggest using it behind
[con_cache](https://github.com/sasa1977/con_cache), which abstracts some of the hard parts.

### Summary
In this article we learned some of the dangers of GenServer, and how using them incorrectly can
lead to bottlenecks in your application. We also learned that using GenServers for long running
functions requires more thought, especially if that same GenServer has both `cast` and `call` as you can
lag the` cast`er due to prior `call`s . Finally we learned to use ETS or Agents instead of GenServers
for storing state if we can.

Next time in *Distributed GenServers* we'll discuss how to use the different tools mentioned
to create a distributed registry.  We’ll also discuss some of the pains and issues around
GenServers at a distributed level.

Have you fallen trap to the GenServer bottleneck pattern? Or have more questions about GenServers?


Let me know in the comments below!
