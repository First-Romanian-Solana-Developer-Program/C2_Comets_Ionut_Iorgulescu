#[derive(Debug)]
enum Message {
    Resize(u32),
    Move(i32, i32),
    Echo(String),
    ChangeColor(u8, u8, u8),
    Quit,
}

fn main() {
    println!("{:?}", Message::Resize(100));
    println!("{:?}", Message::Move(1, 2));
    println!("{:?}", Message::Echo(String::from("Test")));
    println!("{:?}", Message::ChangeColor(255, 255, 0));
    println!("{:?}", Message::Quit);
}
