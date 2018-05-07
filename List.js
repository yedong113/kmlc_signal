function LinkedList() {
    //Node表示要加入列表的项
    console.log('this =', this);
    var Node = function(element) {　　
        this.element = element;　　
        this.next = null;
    };

    var length = 0; //存储列表项的数量
    var head = null; //head存储的是第一个节点的引用

    //向链表尾部追加元素
    this.append = function(element) {　　
        var node = new Node(element),
            current;

        if (head === null) {　　　　
            head = node;　　
        } else {　　　　
            current = head;
            while (current.next) {　　　　　　
                current = current.next;　　　　
            }
            current.next = node;　
        }　
        length++;
    };

    //在链表的任意位置插入元素
    // this.insert = function(position, element) {　　
    //     if (position >= 0 && position <= length) {　　
    //         var node = new Node(element),
    //             　　　　current = head,
    //              		previous, 
    //              		index = 0;
    //         if (position === 0) {　　　　　
    //             node.next = current;　　　　　　
    //             head = node; 　　　　
    //         } else {　　　　
    //             while (index < position) {　　　　　　　　
    //                 previous = current;　　　　　　　　
    //                 previous.next = node;　　　　　　　　
    //                 index++;　　　　　　
    //             }　　　　　　
    //             node.next = current;　　　　　　
    //             previous.next = node;　　　　
    //         }　　
    //         length++;　　
    //         return true;　　
    //     } else {　　　　
    //         return false;　　
    //     }
    // };

    //从链表中移除元素
    this.removeAt = function(position) {　　
        if (position > -1 && position < length) {　　　　
            var current = head,
                previous,
                index = 0;

            if (position === 0) {　　　　　　
                head = current.next;　　　　
            } else {　　　
                while (index < position) {　　　　　　　　
                    // previous = current;　　　　　　　　
                    current = current.next;　　　　　　　　
                    index++;　　　　　　
                }　　　　　　
                //previous.next = current.next;　　　
            }　　
            length--;　　
            return current.element;　　
        } else {　　　　
            return null;
        }
    };

    //返回元素在链表中的位置
    this.indexOf = function(element) {　　
        var current = head,
            index = -1;

        while (current) {　　　　
            if (element === current.element) {　　　　　　
                return index;　　　　
            }　　　　
            index++;　　　　
            current = current.next;　　
        }　　
        return -1;
    };

    //移除某个元素
    this.remove = function(element) {　　
        var index = this.indexOf(element);　　
        return this.removeAt(index);
    };

    //判断链表是否为空

    this.isEmpty = function() {　　
        return length === 0;
    };

    //返回链表的长度
    this.size = function() {
        return length;
    };

    //把LinkedList对象转换成一个字符串

    this.toString = function() {　　
        var current = head,
            string = "";

        while (current) {　　　　
            string = current.element;　　　　
            current = current.next;　　
        }
        return string;
    };
};

var list = new LinkedList();
list.append('1111');
list.append("22222");
list.append("3333");
list.append('333');

console.log(list.removeAt(0))
console.log(list.removeAt(0))
console.log(list.removeAt(0))
console.log(list.removeAt(0))

console.log(list.size());
console.log(list.toString());

module.exports = LinkedList;
console.log("=====================");