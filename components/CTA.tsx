import Image from "next/image";
import {Button} from "@/components/ui/button";
import Link from "next/link";

const Cta = () => {
    return (
        <section className="cta-section">
            <div className="cta-badge">Start learning your way.</div>
            <h2 className="text-3xl font-bold">
                Build and Personalize Your Learnibg Companion
            </h2>
            <p>Pick a name, subject, voice, & personality _ and start learning through voice conversations that feel natural and fun.</p>

            <Image src="images/cta.svg" alt="cta" width={362} height={232} />
            <Button className="btn-primary">
                <Image src="/icons/plus.svg" alt="plus" width={12} height={12} />
                <Link href="/Companions/new">
                    <p>Build a new Companion</p>
                </Link>
            </Button>
        </section>
    )
}
export default Cta
