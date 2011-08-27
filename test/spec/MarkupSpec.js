describe("Markup core spec", function () {
    var template;
    var result;
    var context = {
        name: {first: "John", middle: "", last: "Doe"},
        age: 33.3,
        weight: 145,
        gender: "male",
        alias: " J. Doe ",
        phone: "",
        fax: " ",
        address: "1 Maple Street",
        zip: "12345",
        race: null,
        brothers: ["Jack", "Joe", "Jim"],
        sisters: [{name: "Jill"}, {name: "Jen"}],
        cousin: { name: { first: "Jake" } },
        children: [],
        path: "example.com?a=b c=d",
        link: "<a href=\"http://www.example.com\">example.com</a>",
        greet: " Top  of  the  morning ",
        parents: undefined,
        truthy: true,
        falsy: false,
        obj: { truthy: true, falsy: false }
    };

    beforeEach(function () {
        template = "";
        result = "";
    });

    it("resolves scalar value", function () {
        template = "gender: {{gender}}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: male");

        template = "gender: {{ gender }}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: male");

        template = "gender: {{ gender | upcase }}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: MALE");

        template = "gender: {{ gender | upcase | downcase }}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: male");
    });

    it("preserves white space", function () {
        template = "{{alias}}";
        result = Mark.up(template, context);
        expect(result).toEqual(" J. Doe ");

        template = "{{alias|trim}}";
        result = Mark.up(template, context);
        expect(result).toEqual("J. Doe");

        template = "\n{{alias}}\n";
        result = Mark.up(template, context);
        expect(result).toEqual("\n J. Doe \n");
    });

    it("resolves object dot notation", function () {
        template = "{{name.last}}, {{   name.first   }}";
        result = Mark.up(template, context);
        expect(result).toEqual("Doe, John");

        template = "{{name.last|downcase}}, {{name.first|upcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("doe, JOHN");
    });

    it("resolves nested object notation", function () {
        template = "{{name}}Last name: {{last}}{{/name}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Last name: Doe");
    });

    it("resolves combo object notation", function () {
        template = "{{cousin}}{{name.first}}{{/cousin}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Jake");

        template = "{{cousin}}{{name.last}}{{/cousin}}";
        result = Mark.up(template, context);
        expect(result).toEqual("???");

        //template = "{{cousin.name}}{{first}}{{/cousin.name}}";
        //result = Mark.up(template, context);
        //expect(result).toEqual("Jake");
    });

    it("resolves array index notation", function () {
        template = "First brother: {{brothers.0}}";
        result = Mark.up(template, context);
        expect(result).toEqual("First brother: Jack");

        template = "First sister: {{sisters.0.name}}";
        result = Mark.up(template, context);
        expect(result).toEqual("First sister: Jill");

        template = "First sister: {{sisters.0.name|upcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("First sister: JILL");
    });

    it("resolves template with no context object", function () {
        template = "La la la";
        result = Mark.up(template);
        expect(result).toEqual("La la la");

        // should fail gracefully
        template = "La la {{la}}";
        result = Mark.up(template);
        expect(result).toEqual("La la ???");
    });

    it("resolves single pipe on scalar value", function () {
        template = "gender: {{gender|upcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: MALE");

        template = "age: {{age|round}}";
        result = Mark.up(template, context);
        expect(result).toEqual("age: 33");
    });

    it("resolves null scalar value", function () {
        template = "race: {{race|blank>N/A}}";
        result = Mark.up(template, context);
        expect(result).toEqual("race: N/A");
    });

    it("resolves undefined value", function () {
        template = "whatever: {{whatever|blank>N/A}}";
        result = Mark.up(template, context);
        expect(result).toEqual("whatever: ???");
    });

    it("resolves boolean values", function () {
        template = "{{truthy}} {{falsy}}";
        result = Mark.up(template, context);
        expect(result).toEqual("true false");

        template = "{{obj.truthy}} {{obj.falsy}}";
        result = Mark.up(template, context);
        expect(result).toEqual("true false");
    });

    it("resolves multiple pipes on scalar value", function () {
        template = "gender: {{gender|upcase|chop>2}}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: MA...");

        template = "gender: {{gender | upcase | chop > 2 }}";
        result = Mark.up(template, context);
        expect(result).toEqual("gender: MA...");
    });

    it("resolves simple array", function () {
        template = "brothers: {{brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: JackJoeJim");

        template = "brothers: {{brothers|join> * }}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: Jack * Joe * Jim");

        template = "brothers: {{brothers|join> * /}}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: Jack * Joe * Jim");

        template = "brothers: {{brothers}} {{brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: JackJoeJim JackJoeJim");
    });

    it("resolves self reference in iteration", function () {
        template = "brothers: {{brothers}}+{{.}}+{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: +Jack++Joe++Jim+");

        template = "brothers: {{brothers}}+{{.|upcase}}+{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: +JACK++JOE++JIM+");
    });

    it("resolves object self reference", function () {
        function Adam() {
            this.getName = function () {
                return "Adam";
            };
            this.age = 36;
        };

        template = "Name: {{adam}}{{.|call>getName}}{{/adam}}";
        result = Mark.up(template, { adam: new Adam() });
        expect(result).toEqual("Name: Adam");

        template = "Num: {{num}}{{.|call>toFixed>1}}{{/num}}";
        result = Mark.up(template, { num: 123 });
        expect(result).toEqual("Num: 123.0");
    });

    it("resolves multiple pipes on simple array", function () {
        template = "brothers: {{brothers|sort|join> @ }}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: Jack @ Jim @ Joe");
    });

    it("resolves complex array", function () {
        template = "sisters: {{sisters}}<li>{{name}}</li>{{/sisters}}";
        result = Mark.up(template, context);
        expect(result).toEqual("sisters: <li>Jill</li><li>Jen</li>");
    });

    it("resolves pipe on complex array", function () {
        template = "sisters: {{sisters|reverse}}<li>{{name}}</li>{{/sisters}}";
        result = Mark.up(template, context);
        expect(result).toEqual("sisters: <li>Jen</li><li>Jill</li>");

        template = "sisters: {{sisters|reverse}}<li>{{name|upcase}}</li>{{/sisters}}";
        result = Mark.up(template, context);
        expect(result).toEqual("sisters: <li>JEN</li><li>JILL</li>");
    });

    it("resolves pipe on object", function () {
        template = "obj: {{obj|upcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("obj: [OBJECT OBJECT]");
    });

    it("resolves if true", function () {
        template = "{{if brothers}}{{brothers|size}} brothers{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("3 brothers");

        template = "{{if brothers|empty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if brothers|more>2}}yes!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("yes!");

        template = "{{if gender|equals>male}}{{gender}}!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("male!");

        template = "{{if gender|equals>male}}{{age}}!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("33.3!");

        template = "{{name}}{{first}}{{if .|equals>John}}***{{/if}}{{/first}}{{/name}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");
    });

    it("resolves if false", function () {
        template = "{{if brothers|more>4}}no!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves if/else", function () {
        template = "{{if brothers|more>1}}yes!{{else}}no!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("yes!");

        template = "{{if brothers|less>1}}yes!{{else}}no!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("no!");

        template = "{{if brothers|more>1}}{{brothers.0}}{{else}}no!{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Jack");

        template = "{{if brothers|less>1}}yes!{{else}}{{brothers.1}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Joe");
    });

    it("resolves empty or not empty", function () {
        template = "{{if brothers|empty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if brothers|notempty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if parents|empty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if parents|notempty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves custom pipes", function () {
        // passed arg
        var times = function (num, n) {
            return num * n;
        };

        template = "brothers: {{brothers|size|times>3}}";
        result = Mark.up(template, context, { pipes: { times: times }});
        expect(result).toEqual("brothers: 9");

        // set manually
        Mark.pipes.divide = function (num, n) {
            return num / n;
        };

        template = "brothers: {{brothers|size|divide>3}}";
        result = Mark.up(template, context);
        expect(result).toEqual("brothers: 1");
    });

    it("resolves includes", function () {
        // passed arg
        var greeting = "My name is {{name.first|upcase}}!";

        template = "Hello! {{greeting}}";
        result = Mark.up(template, context, { includes: { greeting: greeting }});
        expect(result).toEqual("Hello! My name is JOHN!");

        // set manually
        Mark.includes.greeting = "My name is {{name.first|downcase}}!";

        template = "Hello! {{greeting}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Hello! My name is john!");

        // pipe include
        template = "Hello! {{greeting|upcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Hello! MY NAME IS JOHN!");
    });

    it("resolves iteration counter", function () {
        template = "{{brothers}}{{#}}-{{.}} {{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("0-Jack 1-Joe 2-Jim ");

        template = "{{brothers}}{{##}}-{{.}} {{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("1-Jack 2-Joe 3-Jim ");

        template = "{{brothers|limit>1}}{{#}}-{{.}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("0-Jack");

        template = "{{brothers}}{{if #|ormore>2}}{{#}}-{{.}}-{{#}}{{/if}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("2-Jim-2");

        template = "{{brothers}}{{if #|more>0|less>2}}{{.}}{{/if}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Joe");

        template = "{{brothers}}{{if #|even}}{{.}}{{/if}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("JackJim");

        template = "{{brothers}}{{if ##|even}}{{.}}{{/if}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Joe");

        template = "{{brothers}}{{if #|odd}}{{.}}{{/if}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Joe");

        template = "{{sisters}}{{#|fix>2}} {{/sisters}}";
        result = Mark.up(template, context);
        expect(result).toEqual("0.00 1.00 ");
    });

    it("resolves pipe: blank", function () {
        template = "{{name.middle|blank>N/A}}";
        result = Mark.up(template, context);
        expect(result).toEqual("N/A");
    });

    it("resolves pipe: empty", function () {
        template = "{{if name.middle|empty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if fax|empty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if children|empty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");
    });

    it("resolves pipe: notempty", function () {
        template = "{{if name.middle|notempty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if fax|notempty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if children|notempty}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: limit", function () {
        template = "{{brothers|limit>1}}{{.}}{{/brothers}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Jack");
    });

    it("resolves pipe: more", function () {
        template = "{{if brothers|more>3}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: ormore", function () {
        template = "{{if brothers|ormore>3}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        expect(Mark.up("{{n|more>123}}", {n: 124})).toEqual("124");
        expect(Mark.up("{{n|more>125}}", {n: 124})).toEqual("false");
        expect(Mark.up("{{n|more>123}}", {n: "124"})).toEqual("124");
        expect(Mark.up("{{n|more>125}}", {n: "124"})).toEqual("false");
        expect(Mark.up("{{n|more>a}}", {n: "b"})).toEqual("b");
        expect(Mark.up("{{n|more>c}}", {n: "b"})).toEqual("false");
        expect(Mark.up("{{n|ormore>b}}", {n: "b"})).toEqual("b");
    });

    it("resolves pipe: less", function () {
        template = "{{if brothers|less>3}}{{.}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: orless", function () {
        template = "{{if brothers|orless>3}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");
    });

    it("resolves pipe: between", function () {
        template = "{{if brothers|between>1>100}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if brothers|between>50>100}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if age|between>30>40}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if age|between>40>50}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: equals", function () {
        template = "{{if age|equals>33.3}}{{age}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("33.3");
    });

    it("resolves pipe: notequals", function () {
        template = "{{if age|notequals>33.3}}{{age}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: like", function () {
        template = "{{if name.first|like>Jo*}}{{name.last}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Doe");

        template = "{{if name.first|like>Adam}}{{name.first}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: notlike", function () {
        template = "{{if name.first|notlike>Jo*}}{{name.first}}{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");
    });

    it("resolves pipe: trim", function () {
        template = "{{alias|trim}}";
        result = Mark.up(template, context);
        expect(result).toEqual("J. Doe");
    });

    it("resolves pipe: pack", function () {
        template = "{{greet|pack}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Top of the morning");
    });

    it("resolves pipe: upcase", function () {
        template = "{{name.first|upcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("JOHN");
    });

    it("resolves pipe: downcase", function () {
        template = "{{name.first|downcase}}";
        result = Mark.up(template, context);
        expect(result).toEqual("john");
    });

    it("resolves pipe: chop", function () {
        template = "{{name.first|chop>1}}";
        result = Mark.up(template, context);
        expect(result).toEqual("J...");

        template = "{{name.first|chop>100}}";
        result = Mark.up(template, context);
        expect(result).toEqual("John");
    });

    it("resolves pipe: round", function () {
        template = "{{age|round}}";
        result = Mark.up(template, context);
        expect(result).toEqual("33");
    });

    it("resolves pipe: size/length", function () {
        template = "{{sisters|size}}";
        result = Mark.up(template, context);
        expect(result).toEqual("2");

        template = "{{children|size}}";
        result = Mark.up(template, context);
        expect(result).toEqual("0");

        template = "{{name.first|size}}";
        result = Mark.up(template, context);
        expect(result).toEqual("4");

        template = "{{name.last|length}}";
        result = Mark.up(template, context);
        expect(result).toEqual("3");
    });

    it("resolves pipe: style", function () {
        template = "{{name.first|style>a b}}";
        result = Mark.up(template, context);
        expect(result).toEqual('<span class="a b">John</span>');
    });

    it("resolves pipe: clean", function () {
        template = "{{link|clean}}";
        result = Mark.up(template, context);
        expect(result).toEqual("example.com");
    });

    it("resolves pipe: sub", function () {
        template = "{{address|sub>Maple>Elm}}";
        result = Mark.up(template, context);
        expect(result).toEqual("1 Elm Street");

        template = "{{address|sub>1>2|sub>Maple>Elm}}";
        result = Mark.up(template, context);
        expect(result).toEqual("2 Elm Street");
    });

    it("resolves pipe: reverse", function () {
        template = "{{brothers|reverse}}";
        result = Mark.up(template, context);
        expect(result).toEqual("JimJoeJack");
    });

    it("resolves pipe: join", function () {
        template = "{{brothers|join}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Jack,Joe,Jim");

        template = "{{brothers|join>-}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Jack-Joe-Jim");
    });

    it("resolves pipe: slice", function () {
        template = "{{brothers|slice>1>1}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Joe");

        template = "{{brothers|slice>1>2|join>-}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Joe-Jim");
    });

    it("resolves pipe: sort", function () {
        template = "{{brothers|sort|join}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Jack,Jim,Joe");

        template = "{{sisters|sort>name}}*{{name}}*{{/sisters}}";
        result = Mark.up(template, context);
        expect(result).toEqual("*Jen**Jill*");

        template = "{{sisters|sort>name|reverse}}*{{name}}*{{/sisters}}";
        result = Mark.up(template, context);
        expect(result).toEqual("*Jill**Jen*");
    });

    it("resolves pipe: choose", function () {
        template = "{{age|more>30|choose>Old>Young}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Old");

        template = "{{age|less>30|choose>Old>Young}}";
        result = Mark.up(template, context);
        expect(result).toEqual("Young");

        template = "{{zip|empty|choose>unzippy>zippy}}";
        result = Mark.up(template, context);
        expect(result).toEqual("zippy");
    });

    it("resolves pipe: fix", function () {
        template = "{{age|fix>3}}";
        result = Mark.up(template, context);
        expect(result).toEqual("33.300");
    });

    it("resolves pipe: mod", function () {
        template = "{{weight|mod>50}}";
        result = Mark.up(template, context);
        expect(result).toEqual("45");
    });

    it("resolves pipe: divisible", function () {
        template = "{{if weight|divisible>5}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("***");

        template = "{{if weight|more>200|divisible>5}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if weight|divisible>7}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{if falsy|divisible>7}}***{{/if}}";
        result = Mark.up(template, context);
        expect(result).toEqual("");

        template = "{{n}}{{if ##|more>5|divisible>3}}{{##}}{{/if}}.{{/n}}";
        result = Mark.up(template, {n:[1,2,3,4,5,6,7,8,9,10,11,12]});
        expect(result).toEqual(".....6...9...12.");
    });

    it("resolves pipe: even", function () {
        template = "{{num|even}}";
        result = Mark.up(template, {num: 222});
        expect(result).toEqual("222");

        template = "{{num|even}}";
        result = Mark.up(template, {num: 333});
        expect(result).toEqual("false");
    });

    it("resolves pipe: odd", function () {
        template = "{{num|odd}}";
        result = Mark.up(template, {num: 222});
        expect(result).toEqual("false");

        template = "{{num|odd}}";
        result = Mark.up(template, {num: 333});
        expect(result).toEqual("333");
    });

    it("resolves pipe: url", function () {
        template = "{{path|url}}";
        result = Mark.up(template, context);
        expect(result).toEqual("example.com?a=b%20c=d");
    });

    it("resolves pipe: bool", function () {
        template = "{{name.first|empty|bool}}";
        result = Mark.up(template, context);
        expect(result).toEqual("false");

        template = "{{name.first|notempty|bool}}";
        result = Mark.up(template, context);
        expect(result).toEqual("true");

        template = "{{brothers|empty|bool}}";
        result = Mark.up(template, context);
        expect(result).toEqual("false");
    });

    it("resolves pipe: call", function () {
        function Doggy() {
            this.TYPE_MUTT = "Mutt";
            this.TYPE_GOLDEN = "Golden Retriever";

            this.greet = function () {
                return "Woof!";
            };

            this.getBreed = function (name) {
                switch (name) {
                    case "Milo":
                        return this.TYPE_MUTT;
                        break;
                    case "Barkley":
                        return this.TYPE_GOLDEN;
                }
                return "N/A";
            };
        }

        template = "{{doggy|call>greet}}";
        result = Mark.up(template, {doggy: new Doggy()});
        expect(result).toEqual("Woof!");

        template = "{{doggy|call>greet|upcase}}";
        result = Mark.up(template, {doggy: new Doggy()});
        expect(result).toEqual("WOOF!");

        template = "{{doggy|call>getBreed}}";
        result = Mark.up(template, {doggy: new Doggy()});
        expect(result).toEqual("N/A");

        template = "{{doggy|call>getBreed>Milo}}";
        result = Mark.up(template, {doggy: new Doggy()});
        expect(result).toEqual("Mutt");

        template = "{{doggy|call>getBreed>Milo|call>toLowerCase}}";
        result = Mark.up(template, {doggy: new Doggy()});
        expect(result).toEqual("mutt");

        template = "{{a|call>toPrecision>5}}";
        context = {a:1, b:2, c:3};
        result = Mark.up(template, context);
        expect(result).toEqual("1.0000");

        template = "{{a|call>join>*}}";
        context = {a:["ad","am","ma","rk"]};
        result = Mark.up(template, context);
        expect(result).toEqual("ad*am*ma*rk");

        template = "{{a|call>getFullYear|equals>2011|choose>Yes>No}}";
        context = {a:new Date(2011,1,1)};
        result = Mark.up(template, context);
        expect(result).toEqual("Yes");

        template = "{{a|call>getFullYear|more>2020|choose>Yes>No}}";
        context = {a:new Date(2011,1,1)};
        result = Mark.up(template, context);
        expect(result).toEqual("No");
    });

    /*
    it("handles nested tags with same property name", function () {
    });

    it("handles nested if statements", function () {
    });

    it("handles if/else statements", function () {
    });
    */

});
